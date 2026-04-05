# 现代化博客系统实现方案

## Context

从零构建一个现代化、易扩展的个人博客系统，不考虑旧数据兼容，重点是打好技术地基，方便未来功能扩展。

## 技术选型（轻量但扎实）

### 后端：Express + TypeScript + Prisma
- **理由**：比 NestJS 轻量，但通过 TypeScript + 分层架构保证可维护性
- **数据库**：PostgreSQL（全文搜索够用，暂不引入 MeiliSearch）
- **缓存**：Redis（可选，第一版先做内存缓存，预留 Redis 接口）
- **认证**：JWT + bcrypt

### 前端：Next.js 15 + React + Tailwind CSS
- **理由**：SSR/SSG 对 SEO 友好，统一前后端语言，组件化易于扩展
- **Markdown**：MDX 支持（用于文章内容）
- **图片处理**：支持拖拽上传、批量上传、图片库管理

## 数据库 Schema 设计

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String   // bcrypt 哈希
  role      UserRole @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  comments  Comment[]
}

enum UserRole {
  ADMIN
  AUTHOR
}

model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   // Markdown 内容
  excerpt     String?  // 摘要
  status      PostStatus @default(DRAFT)
  isPinned    Boolean  @default(false)
  viewCount   Int      @default(0)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  categories  CategoryOnPost[]
  tags        TagOnPost[]
  comments    Comment[]
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  parentId  String?
  parent    Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryHierarchy")
  posts     CategoryOnPost[]
}

model CategoryOnPost {
  postId     String
  categoryId String
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@id([postId, categoryId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts TagOnPost[]
}

model TagOnPost {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([postId, tagId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String?
  author    User?    @relation(fields: [authorId], references: [id])
  guestName String?  // 访客评论
  guestEmail String?
  parentId  String?
  parent    Comment? @relation("CommentThread", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentThread")
  path      String   // 如 "001.003"，用于排序
  status    CommentStatus @default(PENDING)
  createdAt DateTime @default(now())
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
}

model Media {
  id          String   @id @default(cuid())
  filename    String   // 存储文件名（UUID）
  originalName String  // 原始文件名
  mimeType    String   // MIME 类型
  size        Int      // 文件大小（字节）
  width       Int?     // 图片宽度
  height      Int?     // 图片高度
  url         String   // 访问 URL
  thumbnailUrl String? // 缩略图 URL
  mediumUrl   String?  // 中等尺寸 URL
  storageType StorageType @default(LOCAL)
  uploaderId  String
  uploader    User     @relation(fields: [uploaderId], references: [id])
  createdAt   DateTime @default(now())
}

enum StorageType {
  LOCAL
  ALIYUN_OSS
  AWS_S3
}
```

## 项目结构

```
myblog-v2/
├── apps/
│   ├── api/              # Express + TypeScript 后端
│   │   ├── src/
│   │   │   ├── modules/  # 功能模块
│   │   │   ├── lib/      # 基础设施
│   │   │   └── main.ts
│   │   └── package.json
│   └── web/              # Next.js 前端
│       ├── src/
│       │   ├── app/      # App Router
│       │   └── components/
│       └── package.json
├── packages/
│   └── shared/           # 共享类型和工具
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml    # PG + Redis
└── package.json          # monorepo
```

## 实现阶段

### 阶段 1：基础设施（优先）
- 初始化 monorepo（pnpm workspaces）
- Prisma Schema + PostgreSQL
- Express API 基础框架（路由、中间件、错误处理）
- Next.js 前端基础布局

### 阶段 2：核心内容模块
- 用户认证（JWT 登录）
- 文章 CRUD（Markdown 编辑器）
- 分类和标签管理
- 文章列表和详情页

### 阶段 3：增强功能
- 评论系统
- 全文搜索（PG tsvector）
- RSS 订阅
- 媒体上传和图片管理

### 图片/照片功能详解
- **图片上传**：拖拽上传、批量上传、粘贴上传
- **图片格式**：支持 JPG/PNG/WebP/HEIC，自动转 WebP 优化体积
- **缩略图生成**：自动生成多种尺寸（小图 200px、中图 800px、原图）
- **图片管理**：媒体库界面，支持查看、删除、重命名、按日期筛选
- **Markdown 集成**：编辑器中一键插入图片，支持图片对齐方式
- **存储抽象**：先存本地文件系统，预留 OSS/S3 接口方便后续切换
- **性能优化**：图片通过 Nginx 直接 serve，不经过 Node.js

### 阶段 4：优化
- Redis 缓存
- SEO 优化
- 性能优化

## API 设计规范

```
# 认证
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

# 文章
GET    /api/posts?page=1&limit=10&category=xxx&tag=xxx
GET    /api/posts/:slug
POST   /api/posts          (admin)
PUT    /api/posts/:id      (admin)
DELETE /api/posts/:id      (admin)

# 分类
GET    /api/categories
POST   /api/categories     (admin)
PUT    /api/categories/:id (admin)

# 标签
GET    /api/tags

# 评论
GET    /api/posts/:postId/comments
POST   /api/posts/:postId/comments
PUT    /api/comments/:id   (admin)
DELETE /api/comments/:id   (admin)

# 搜索
GET    /api/search?q=keyword

# 媒体
GET    /api/media          (admin)
POST   /api/media/upload   (admin)
DELETE /api/media/:id      (admin)
```

## 关键文件路径

- `prisma/schema.prisma` - 数据模型
- `apps/api/src/main.ts` - 后端入口
- `apps/api/src/modules/posts/posts.service.ts` - 文章服务
- `apps/web/src/app/page.tsx` - 首页
- `docker-compose.yml` - 本地开发环境
