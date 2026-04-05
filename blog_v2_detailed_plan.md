# 现代化博客系统 v2 最终版架构方案（生产级）

## Context

从零构建一个现代化、易扩展的个人博客系统。本方案已将所有"上线前必须定死"的生产级细节明确下来，包括认证方式、媒体异步处理、数据库索引/约束、运维闭环、内容模型、搜索范围和评论反垃圾策略。

### 核心设计原则
- **能开工**: 技术栈成熟，学习曲线平缓
- **能部署**: Docker 一键部署，包含健康检查和备份策略
- **能扩展**: 分层架构，存储/缓存/搜索均可替换

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端 | Express + TypeScript + 分层架构 |
| 数据库 | PostgreSQL + Prisma ORM |
| 前端 | Next.js 15 + React + Tailwind CSS |
| 认证 | **JWT 承载于 httpOnly Cookie（明确）** + bcrypt |
| 存储 | 适配器抽象（Local → OSS → S3） |
| 搜索 | PostgreSQL 全文搜索（tsvector，**仅标题/摘要/正文**） |
| 部署 | Docker Compose + Nginx |

---

## 项目结构

```
myblog-v2/
├── apps/
│   ├── api/                    # Express + TypeScript 后端
│   │   └── src/
│   │       ├── modules/        # 业务模块
│   │       │   ├── auth/       # 认证
│   │       │   ├── posts/      # 文章
│   │       │   ├── categories/ # 分类
│   │       │   ├── tags/       # 标签
│   │       │   ├── comments/   # 评论
│   │       │   └── media/      # 媒体
│   │       ├── lib/            # 基础设施
│   │       │   ├── storage/    # 存储适配器
│   │       │   ├── queue/      # 异步任务队列
│   │       │   ├── middleware/
│   │       │   └── utils/
│   │       └── main.ts
│   └── web/                    # Next.js 15 前端
│       └── src/
│           ├── app/            # App Router
│           │   ├── admin/      # 管理后台
│           │   ├── posts/      # 文章前台
│           │   └── search/
│           └── components/
├── packages/shared/            # 共享类型和工具
├── prisma/                     # 数据模型和迁移
│   ├── schema.prisma
│   └── migrations/
├── docker/                     # Docker 配置
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   ├── nginx.Dockerfile
│   ├── nginx.conf
│   ├── backup.sh
│   └── restore.sh
├── logs/                       # 日志目录（生产环境挂载）
├── data/                       # 数据目录（生产环境挂载）
│   ├── media/                  # 媒体文件
│   ├── media-tmp/              # 媒体临时目录（异步处理用）
│   └── backups/                # 数据库备份
├── docker-compose.yml
├── docker-compose.prod.yml
└── package.json
```

---

## 一、认证安全设计（上线前必须定死）

### 认证方式（明确）

**绝不允许前端持有 Token**，登录态 100% 存储于服务端 Cookie。

- **Token 载体**: JWT 存储于 `httpOnly`、`Secure`、`SameSite=Lax` Cookie
- **前端不持有 Token**: 完全通过 Cookie 自动携带，避免 XSS 窃取
- **CSRF 防护**: CSRF Token 用于所有写操作（POST/PUT/DELETE）

### Cookie 配置（明确）

```typescript
res.cookie('auth_token', token, {
  httpOnly: true,       // 前端 JavaScript 无法读取
  secure: process.env.NODE_ENV === 'production',  // HTTPS 仅生产环境
  sameSite: 'lax',      // 防止 CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 天
  path: '/'
})
```

### CSRF 策略（明确）

- **GET/HEAD/OPTIONS**: 不需要 CSRF Token（只读操作）
- **POST/PUT/DELETE**: 需要 CSRF Token
- **Token 获取**: `GET /api/auth/csrf` 返回 CSRF Token，存储于内存（不存 localStorage）
- **Token 传递**: 通过请求头 `X-CSRF-Token` 传递

### 登录安全措施（明确）

1. **登录失败限制**: 连续 5 次失败锁定 15 分钟
2. **密码加密**: bcrypt salt rounds = 12
3. **审计日志**: 记录所有登录/登出/失败尝试，永久保留
4. **限流**:
   - 登录接口: 10 次/分钟/IP
   - 登出接口: 5 次/分钟/IP

### 前后端部署方式（明确推荐）

**同域部署（推荐）**:
- Nginx 作为统一入口
- `https://your-domain/*` → 前端
- `https://your-domain/api/*` → 后端
- 无需复杂 CORS 配置
- SameSite=Lax 即可正常工作

**跨域部署（仅特殊情况）**:
- 配置 CORS: `Access-Control-Allow-Credentials: true`
- Cookie: `SameSite=None; Secure`
- 需要 HTTPS

---

## 二、媒体处理流程（上线前必须定死）

### 异步处理策略（明确）

**绝对不允许在 API 请求中同步处理图片**，必须采用"上传先落盘，处理后补元数据"的流水线。

### 三步异步流水线

```
1. 接收上传（同步，<100ms）
   ├─ 验证文件大小/类型（仅魔数检查）
   ├─ 生成临时文件路径
   ├─ 写入临时目录 /data/media-tmp/
   ├─ 创建 Media 记录（status=PENDING）
   └─ 返回 202 Accepted + mediaId

2. 后台处理（异步，任务队列）
   ├─ 从临时目录读取文件
   ├─ 验证文件魔数（二次确认）
   ├─ 计算 SHA-256 hash（去重检查）
   ├─ 如果 hash 已存在 → 直接复用已有 Media，删除临时文件
   ├─ 否则继续：
   │  ├─ 转换为 WebP 格式
   │  ├─ 生成缩略图（200px，宽高比保持）
   │  ├─ 生成中图（800px，宽高比保持）
   │  ├─ 移动到正式存储位置 /data/media/{year}/{month}/
   │  └─ 删除临时文件
   └─ 更新 Media 记录（status=READY，补充元数据）

3. 状态查询（前端轮询）
   └─ GET /api/media/:id/status → 返回 PENDING/READY/FAILED
```

### 任务队列实现（明确）

- **第一版**: 使用 BullMQ 与 API 同进程（后续可拆出独立 worker）
- **后续扩展**: 可拆出独立 worker 容器
- **失败重试**: 失败后重试 2 次，仍失败则标记为 FAILED

### 支持格式（明确）

- 输入: JPG、PNG、WebP、HEIC
- 输出: WebP（统一格式，质量 85）
- 文件大小限制: 单张 10MB

### 存储路径规则（明确）

```
正式存储:
/data/media/{year}/{month}/{uuid}.webp          (原图)
/data/media/{year}/{month}/{uuid}_thumb.webp    (缩略图 200px)
/data/media/{year}/{month}/{uuid}_medium.webp   (中图 800px)

临时存储:
/data/media-tmp/{uuid}.tmp
```

### 去重策略（明确）

- 基于 SHA-256 hash 去重
- hash 相同则直接复用已有 Media 记录
- 更新 uploadedAt 但保留原 createdAt

---

## 三、数据库层设计（上线前必须定死）

### 完整 Prisma Schema

```prisma
// ========== 用户表 ==========
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  password      String   // bcrypt 哈希，rounds=12
  role          UserRole @default(ADMIN)
  status        UserStatus @default(ACTIVE)
  lastLoginAt   DateTime?
  loginAttempts Int      @default(0)
  lockedUntil   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  posts     Post[]
  comments  Comment[]
  media     Media[]
}

enum UserRole {
  ADMIN
  AUTHOR
}

enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
}

// ========== 文章表 ==========
model Post {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  content       String   // Markdown 内容（第一版不使用 MDX）
  excerpt       String?
  status        PostStatus @default(DRAFT)
  isPinned      Boolean  @default(false)
  viewCount     Int      @default(0)
  readingTime   Int?     // 阅读时长（分钟，中文约 300 字/分钟）
  coverImageId  String?
  coverImage    Media?   @relation("PostCover", fields: [coverImageId], references: [id])
  seoTitle      String?
  seoDescription String?
  scheduledAt   DateTime?
  searchVector  Unsupported("tsvector")?

  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])

  categories  CategoryOnPost[]
  tags        TagOnPost[]
  comments    Comment[]

  // 索引（明确）
  @@index([slug])
  @@index([status, publishedAt])
  @@index([authorId, createdAt])
  @@index([searchVector], type: Gin)
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

// ========== 分类表 ==========
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0)
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts CategoryOnPost[]

  @@index([slug])
}

model CategoryOnPost {
  postId     String
  categoryId String
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
}

// ========== 标签表 ==========
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts TagOnPost[]

  @@index([slug])
}

model TagOnPost {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}

// ========== 评论表（软删除）==========
model Comment {
  id        String        @id @default(cuid())
  content   String
  postId    String
  post      Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String?
  author    User?         @relation(fields: [authorId], references: [id])
  guestName String?       // 访客评论
  guestEmail String?
  parentId  String?
  parent    Comment?      @relation("CommentThread", fields: [parentId], references: [id])
  replies   Comment[]     @relation("CommentThread")
  path      String        // 如 "001.003"，用于排序
  status    CommentStatus @default(PENDING)
  // 风控字段
  ipHash    String?       // SHA-256(IP)
  userAgent String?
  // 软删除（明确）
  deletedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([postId])
  @@index([parentId])
  @@index([status, createdAt])
}

enum CommentStatus {
  PENDING     // 待审核（默认）
  APPROVED    // 已通过
  REJECTED    // 已拒绝
  SPAM        // 垃圾评论
}

// ========== 媒体表 ==========
model Media {
  id           String      @id @default(cuid())
  filename     String      // UUID 文件名
  originalName String      // 原始文件名
  storageKey   String      // 存储路径/key（如 "2024/04/abc123.webp"）
  hash         String?     // SHA-256 hash（去重用）
  altText      String?     // 图片 alt 文本
  mimeType     String
  size         Int         // 字节
  width        Int?
  height       Int?
  url          String
  thumbnailUrl String?
  mediumUrl    String?
  storageType  StorageType @default(LOCAL)
  uploaderId   String
  uploader     User        @relation(fields: [uploaderId], references: [id])
  // 异步处理状态
  status       MediaStatus @default(PENDING)
  errorMessage String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([hash])
  @@index([uploaderId, createdAt])
  @@index([status, createdAt])
}

enum StorageType {
  LOCAL
  ALIYUN_OSS
  AWS_S3
}

enum MediaStatus {
  PENDING    // 等待处理
  PROCESSING // 处理中
  READY      // 就绪
  FAILED     // 失败
}
```

### 索引策略（明确，性能关键）

| 表 | 字段 | 类型 | 用途 |
|----|------|------|------|
| User | username | UNIQUE | 用户名登录 |
| User | email | UNIQUE | 邮箱登录 |
| Post | slug | UNIQUE | 通过 slug 查询文章 |
| Post | status, publishedAt | COMPOSITE | **列表页高频查询**（已发布文章按时间倒序） |
| Post | authorId, createdAt | COMPOSITE | 后台文章列表 |
| Post | searchVector | GIN | 全文搜索 |
| Category | slug | UNIQUE | 通过 slug 查询分类 |
| Tag | slug | UNIQUE | 通过 slug 查询标签 |
| Comment | postId | INDEX | **获取文章评论（高频）** |
| Comment | parentId | INDEX | **获取评论回复（高频）** |
| Comment | status, createdAt | COMPOSITE | 待审核评论列表 |
| Media | hash | INDEX | 文件去重 |
| Media | uploaderId, createdAt | COMPOSITE | 媒体库列表 |
| Media | status, createdAt | COMPOSITE | 异步处理队列 |

### 唯一约束（明确）

- `User.username`: 唯一
- `User.email`: 唯一
- `Post.slug`: 唯一
- `Category.name`: 唯一
- `Category.slug`: 唯一
- `Tag.name`: 唯一
- `Tag.slug`: 唯一

### 软删除策略（明确）

- **Comment 表**: 使用 `deletedAt` 软删除
- **其他表**: 物理删除（文章、媒体等删除后不留痕）
- **删除逻辑**:
  - 删除 Post 时，级联删除 Comment、CategoryOnPost、TagOnPost
  - 删除 Comment 时，仅设置 `deletedAt`，不物理删除

---

## 四、运维闭环（上线前必须定死）

### 数据库迁移策略（明确）

#### 迁移执行流程

```
发布前：
1. 本地创建迁移: npx prisma migrate dev --name xxx
2. 代码提交，迁移文件进入 git
3. 准备发布

发布时：
1. 拉取最新代码
2. 备份数据库（先备份，后迁移！）
3. 执行迁移: npx prisma migrate deploy
4. 验证迁移成功
5. 重启应用容器

失败回滚：
1. 如果迁移失败，立即停止发布
2. 从备份恢复数据库
3. 回滚代码到上一版本
4. 重启旧版本容器
```

#### 迁移脚本位置

- 迁移文件: `prisma/migrations/{timestamp}_{name}/migration.sql`
- 迁移执行: 生产环境使用 `prisma migrate deploy`（非交互式）

### 日志策略（明确）

#### 日志目录结构（生产环境挂载）

```
/logs/
├── nginx/
│   ├── access.log    // Nginx 访问日志
│   └── error.log     // Nginx 错误日志
├── api/
│   ├── access.log    // API 访问日志
│   ├── error.log     // API 错误日志
│   └── audit.log     // 审计日志（永久）
└── web/
    └── app.log       // Next.js 日志
```

#### 日志格式（明确，全链路 RequestId）

**访问日志**:
```json
{
  "timestamp": "2024-04-04T10:00:00Z",
  "requestId": "abc-123-def-456",
  "method": "GET",
  "path": "/api/posts",
  "statusCode": 200,
  "durationMs": 45,
  "ip": "1.2.3.4",
  "userAgent": "Mozilla/5.0...",
  "userId": "user-123"
}
```

**错误日志**:
```json
{
  "timestamp": "2024-04-04T10:00:00Z",
  "requestId": "abc-123-def-456",
  "error": "Error message",
  "stack": "Error stack trace",
  "context": { "path": "/api/posts", "method": "POST" }
}
```

**审计日志**（永久保留）:
```json
{
  "timestamp": "2024-04-04T10:00:00Z",
  "requestId": "abc-123-def-456",
  "action": "LOGIN_SUCCESS",
  "userId": "user-123",
  "username": "admin",
  "ip": "1.2.3.4",
  "details": {}
}
```

#### 日志保留期（明确）

- 访问日志: 30 天
- 错误日志: 90 天
- 审计日志: 永久

### RequestId 全链路追踪（明确）

1. **生成**: Nginx 或 API 网关生成 RequestId（UUID v4）
2. **传递**:
   - 请求头: `X-Request-Id`
   - 响应头: `X-Request-Id`
   - 所有日志: 必须包含 RequestId
   - 异步任务: 传递 RequestId
3. **查询**: 出错时用户提供 RequestId，可快速定位日志

### 健康检查端点（明确）

```
GET /api/health
  用途: 服务存活检查
  返回: 200 OK + { "status": "healthy" }
  不检查依赖（数据库等）

GET /api/ready
  用途: 依赖就绪检查
  检查:
    - 数据库连接
    - 存储可写
    - 任务队列连接
  返回:
    - 200 OK + { "status": "ready" }
    - 503 Service Unavailable + { "status": "not_ready", "issues": [...] }
```

### 生产环境最小权限原则（明确）

- **数据库用户**: 仅授予必要权限（SELECT/INSERT/UPDATE/DELETE，无 DROP/ALTER）
- **API 容器**: 非 root 用户运行
- **Nginx 容器**: non-root 用户运行
- **文件系统**:
  - `/data/media/`: 只读给 Nginx，读写给 API
  - `/data/media-tmp/`: 仅 API 可写
  - `/logs/`: 仅对应容器可写

---

## 五、内容模型（上线前必须定死）

### Markdown vs MDX（明确决定）

**第一版统一使用 Markdown，不引入 MDX**

- **内容存储**: 纯 Markdown 文本
- **渲染**: `react-markdown` + `remark-gfm`
- **代码高亮**: `shiki`
- **不使用 MDX 理由**:
  - 简化编译链
  - 简化预览链
  - 简化内容安全处理
  - 降低编辑器复杂度
- **后续扩展**: 需要嵌入组件时再引入 MDX

### 文章内容字段（明确）

```typescript
interface Post {
  title: string
  slug: string
  content: string  // 纯 Markdown，仅此一种格式
  excerpt?: string
  status: PostStatus
  isPinned: boolean
  readingTime?: number  // 分钟，中文约 300 字/分钟
  coverImageId?: string
  seoTitle?: string
  seoDescription?: string
  scheduledAt?: Date
}
```

---

## 六、搜索设计（上线前必须定死）

### 搜索范围（明确收窄）

**第一版仅搜索这三个字段**：

1. **标题** (`title`) - 权重最高 (A)
2. **摘要** (`excerpt`) - 权重中等 (B)
3. **正文** (`content`) - 权重最低 (C)

**暂不包含**：
- ❌ 标签名（作为单独的筛选条件）
- ❌ 分类名（作为单独的筛选条件）

### PostgreSQL 实现（明确）

```sql
-- 创建 tsvector 生成函数
CREATE FUNCTION post_search_vector(post Post) RETURNS tsvector AS $$
BEGIN
  RETURN setweight(to_tsvector('english', coalesce(post.title, '')), 'A') ||
         setweight(to_tsvector('english', coalesce(post.excerpt, '')), 'B') ||
         setweight(to_tsvector('english', coalesce(post.content, '')), 'C');
END
$$ LANGUAGE plpgsql IMMUTABLE;

-- 创建触发器自动更新
CREATE TRIGGER post_search_vector_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, excerpt, content);
```

### 搜索查询逻辑（明确）

```typescript
async function searchPosts(q: string) {
  const query = q.replace(/['":]/g, '')  // 清理特殊字符
  return prisma.$queryRaw`
    SELECT
      id, title, slug, excerpt,
      ts_rank(search_vector, websearch_to_tsquery('english', ${query})) as rank
    FROM posts
    WHERE
      status = 'PUBLISHED'
      AND search_vector @@ websearch_to_tsquery('english', ${query})
    ORDER BY rank DESC, publishedAt DESC
    LIMIT 20
  `
}
```

---

## 七、评论反垃圾策略（上线前必须定死）

### 评论状态（明确）

| 状态 | 说明 |
|------|------|
| PENDING | 待审核（默认，公众不可见） |
| APPROVED | 已通过（公众可见） |
| REJECTED | 已拒绝（公众不可见） |
| SPAM | 垃圾评论（公众不可见） |

**默认审核制**: 所有评论默认 PENDING，需后台审核后才能展示。

### 反垃圾措施（明确）

1. **频率限制**（明确）
   - 同一 IP: 5 条/小时
   - 同一文章: 1 条/5分钟（同一用户/IP）

2. **IP/指纹记录**（明确）
   - 记录 `ipHash` (SHA-256(IP))，不存原始 IP
   - 记录 `userAgent`
   - 可按 IP 维度批量审核/拒绝

3. **内容基础检查**（明确）
   - 链接数量限制: 最多 2 条链接
   - 敏感词过滤: 基础敏感词库
   - 长度限制: 最多 2000 字

4. **审核工具**（明确）
   - 待审核评论列表
   - 批量通过/拒绝/标记垃圾
   - 按 IP 筛选
   - 按时间筛选
   - 审核时可查看 IP Hash 和 User Agent

### 评论展示规则（明确）

- 仅展示 `status = APPROVED` 且 `deletedAt IS NULL` 的评论
- 按 `path` 排序（树形结构）
- 访客评论显示 `guestName`，不显示邮箱

---

## 八、单机云服务器部署拓扑（生产级标准答案）

### 运行组件

| 组件 | 端口 | 说明 | 持久化 | 用户 |
|------|------|------|--------|------|
| Nginx | 80, 443 | 反向代理、SSL、静态文件服务 | 配置文件 | nginx (non-root) |
| Web (Next.js) | 3000 | 前端应用 | 无 | node (non-root) |
| API (Express) | 4000 | 后端 API | 无 | node (non-root) |
| PostgreSQL | 5432 | 数据库 | `/data/postgres` | postgres |
| (可选) Redis | 6379 | 缓存/队列 | 无 | redis |

### 请求流向

```
访客 → Nginx (443/HTTPS)
       ├─ /static/* → Nginx 直接服务 (public files)
       ├─ /media/* → Nginx 直接服务 (图片文件，readonly)
       ├─ /api/* → 转发到 API (localhost:4000)
       └─ /* → 转发到 Web (localhost:3000)
```

### 目录挂载（生产环境，明确）

```
/home/claude/myblog-v2/
├── data/
│   ├── media/          → /data/media (持久化，API 读写，Nginx 只读)
│   ├── media-tmp/      → /data/media-tmp (持久化，仅 API 读写)
│   ├── backups/        → /data/backups (持久化，备份脚本读写)
│   └── postgres/       → /data/postgres (持久化，仅 PostgreSQL)
└── logs/
    ├── nginx/          → /logs/nginx (持久化)
    ├── api/            → /logs/api (持久化)
    └── web/            → /logs/web (持久化)
```

### 备份策略（明确）

- **数据库**: 每日凌晨 3:00 自动备份，保留最近 7 天
- **媒体文件**: 每日增量备份，保留最近 30 天
- **备份验证**: 每周一次恢复测试
- **备份脚本**: `docker/backup.sh`
- **恢复脚本**: `docker/restore.sh`

---

## 上线版 v1.0 清单（仅第一阶段，明确 MVP 范围）

### 必须包含（第一版）

- ✅ 项目初始化（monorepo + Docker + Prisma）
- ✅ 后端基础框架（RequestId + 三类日志 + 健康检查）
- ✅ 用户认证（**httpOnly Cookie 明确** + 登录失败限制 + 审计日志）
- ✅ 文章 CRUD（Markdown 明确 + 定时发布 + 分类标签 + 正确排序）
- ✅ PostgreSQL 全文搜索（**仅标题/摘要/正文 明确**）
- ✅ 前台展示（首页/列表/详情/搜索）
- ✅ 后台管理（文章/分类/标签）
- ✅ 数据库设计（**索引/唯一约束/软删除 明确**）
- ✅ 生产环境 Docker 部署（Nginx + 备份策略 + **运维闭环 明确**）

### 暂不包含（后续阶段）

- ❌ 图片上传和媒体库（异步处理已设计，但第二阶段实现）
- ❌ 评论系统（反垃圾策略已设计，但第二阶段实现）
- ❌ Redis 缓存
- ❌ 高级 SEO（Open Graph 等）
- ❌ 监控面板（Grafana）
- ❌ MDX 支持（明确不用）

---

## 关键文件清单

| 文件路径 | 说明 |
|----------|------|
| `prisma/schema.prisma` | 完整数据模型（含所有索引/约束） |
| `apps/api/src/main.ts` | 后端入口 + RequestId + 日志中间件 |
| `apps/api/src/lib/utils/logger.ts` | 日志工具（三类日志） |
| `apps/api/src/lib/middleware/auth.middleware.ts` | 认证中间件（httpOnly Cookie） |
| `apps/api/src/modules/auth/auth.service.ts` | 认证服务（登录失败限制） |
| `apps/api/src/modules/posts/posts.service.ts` | 文章服务（排序逻辑） |
| `apps/api/src/lib/storage/storage.adapter.ts` | 存储适配器接口 |
| `apps/api/src/lib/queue/` | 异步任务队列（媒体处理） |
| `docker-compose.prod.yml` | 生产部署配置（含 Nginx） |
| `docker/backup.sh` | 数据库备份脚本 |
| `docker/restore.sh` | 数据库恢复脚本 |

---

## 里程碑总结

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|----------|
| M0: 项目搭建 | 2天 | 可运行的开发环境 | docker compose up 能启动 PostgreSQL，Next.js 能运行 |
| M1: MVP 上线 | 10天 | 可发布文章的博客 | 满足"上线版 v1.0 清单"的所有项 |
| M2: 媒体功能 | 17天 | 完整图片管理 | 异步处理流水线，能上传图片、管理媒体库 |
| M3: 可扩展版 | 24天 | 评论 + 缓存 | 访客能评论，反垃圾策略，热点数据有缓存 |
| M4: 生产就绪 | 28天 | 监控 + 安全加固 | 完整的日志、监控、安全配置 |

---

## 风险点与应对

| 风险 | 影响 | 概率 | 应对 |
|------|------|------|------|
| 学习曲线 | 中 | 中 | 优先 MVP，新技术逐步引入 |
| 开发时间超期 | 高 | 中 | 严格控制 MVP 范围，按"上线版 v1.0 清单"执行 |
| 图片上传阻塞主请求 | 高 | 低 | **明确异步处理**，先返回 202，后台处理 |
| 搜索性能不足 | 中 | 低 | PG 全文搜索够用，**明确限定搜索范围** |
| 部署复杂度高 | 中 | 中 | 提供"单机标准答案"，一键 Docker 部署 |
| 认证安全问题 | 高 | 低 | **明确 httpOnly Cookie + CSRF**，前端不持有 Token |
| 数据库查询慢 | 高 | 中 | **明确索引策略**，按高频查询设计索引 |

---

## 最终结论

这套方案已将所有"上线前必须定死"的点明确下来，包括：

1. ✅ **认证方式**: httpOnly Cookie + CSRF + SameSite（明确）
2. ✅ **媒体处理**: 异步流水线 + 任务队列（明确）
3. ✅ **数据库层**: 索引/唯一约束/软删除（明确）
4. ✅ **运维闭环**: 迁移/回滚/日志/RequestId/最小权限（明确）
5. ✅ **内容模型**: 第一版只用 Markdown（明确）
6. ✅ **搜索范围**: 仅标题/摘要/正文（明确）
7. ✅ **评论反垃圾**: 频率限制/IP记录/默认审核/批量审核（明确）

**方案已具备开工条件，可以开始实施。**
