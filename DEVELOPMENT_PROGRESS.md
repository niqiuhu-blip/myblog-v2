# 开发进展总结

## 日期

**开始日期**: 2026-04-05
**最后更新**: 2026-04-06

---

## 一、已完成工作

### 1. 项目初始化与架构设计

✅ 完成了完整的技术选型和架构设计：

- **技术栈确定**: Express + TypeScript + Prisma + PostgreSQL + Next.js 15 + Tailwind CSS
- **架构方案文档: `blog_v2_architecture_plan.md` - 包含完整的生产级架构设计
- **详细实现计划**: `blog_v2_detailed_plan.md` - 详细的实现方案

### 2. 项目结构搭建

✅ 完成 monorepo 项目结构：

```
myblog-v2/
├── apps/
│   ├── api/              # Express + TypeScript 后端
│   └── web/              # Next.js 15 前端
├── packages/
│   └── shared/             # 共享类型和工具
├── prisma/                 # Prisma Schema 和迁移
├── docker/                 # Docker 配置
├── data/                   # 数据目录
└── logs/                   # 日志目录
```

### 3. 数据库设计

✅ 完成完整的 Prisma Schema 设计 (`prisma/schema.prisma`)：

- 用户表 (User) - 支持管理员/作者角色，登录安全字段
- 文章表 (Post) - 支持草稿/定时发布/已发布/归档状态，全文搜索支持
- 分类表 (Category) - 支持层级分类
- 标签表 (Tag)
- 评论表 (Comment) - 软删除，访客评论支持
- 媒体表 (Media) - 异步处理状态，去重支持

✅ 索引和约束设计完善，包含完整的索引策略和唯一约束

✅ 完成种子数据脚本 (`prisma/seed.ts`) - 创建默认管理员用户

### 4. Docker 配置

✅ 完成 Docker 相关配置：

- `docker-compose.yml` - 开发环境配置（PostgreSQL）
- `docker-compose.prod.yml` - 生产环境配置（含 Nginx）
- `docker/api.Dockerfile` - 后端容器化配置
- `docker/web.Dockerfile` - 前端容器化配置
- `docker/nginx.Dockerfile` - Nginx 容器配置
- `docker/nginx.conf` - Nginx 反向代理配置
- `docker/backup.sh` - 数据库备份脚本
- `docker/restore.sh` - 数据库恢复脚本

### 5. 后端 API 开发 ✨

✅ 完成后端核心框架和模块：

**基础框架**:
- RequestId 中间件 (`apps/api/src/lib/middleware/requestId.middleware.ts`)
- 错误处理中间件 (`apps/api/src/lib/middleware/error.middleware.ts`)
- 认证中间件 (`apps/api/src/lib/middleware/auth.middleware.ts`)
- 日志工具 (`apps/api/src/lib/utils/logger.ts`) - 支持访问/错误/审计三类日志
- 响应工具 (`apps/api/src/lib/utils/response.ts`)
- 主入口文件 (`apps/api/src/main.ts`) - 包含安全中间件、限流、CORS 配置

**业务模块**:
- 健康检查模块 (`apps/api/src/modules/health/`) - /api/health, /api/ready
- 认证模块 (`apps/api/src/modules/auth/`) - 登录、登出、获取当前用户、CSRF Token
- 文章模块 (`apps/api/src/modules/posts/`) - 文章 CRUD、发布、分类标签关联
- 分类模块 (`apps/api/src/modules/categories/`) - 分类 CRUD
- 标签模块 (`apps/api/src/modules/tags/`) - 标签 CRUD

### 6. 前端开发 ✨

✅ 完成前端基础框架和页面：

**基础配置**:
- Next.js 15 配置
- Tailwind CSS 配置
- TypeScript 配置
- 全局样式配置 (`apps/web/src/app/globals.css`)

**页面和组件**:
- 布局 (`apps/web/src/app/layout.tsx`)
- 首页 (`apps/web/src/app/page.tsx`)
- 管理后台 (`apps/web/src/app/admin/`)
- 文章页面 (`apps/web/src/app/posts/`)
- 搜索页面 (`apps/web/src/app/search/`)
- 组件库 (`apps/web/src/components/`)
- 工具库 (`apps/web/src/lib/`)

### 7. 共享包

✅ 完成共享包配置：

- 共享类型定义 (`packages/shared/src/index.ts`)
- 共享工具函数 (`packages/shared/src/index.ts`)

### 8. 环境配置

✅ 完成环境配置：

- `.env.example` - 环境变量示例
- `.env` - 本地开发环境配置

### 9. Docker 和数据库环境

✅ 完成 Docker 安装和配置：
- Docker Engine 29.3.1
- Docker Compose v5.1.1
- Docker 服务已启动并启用

✅ PostgreSQL 安装：
- 由于 Docker Hub 网络问题，采用本地安装方式
- PostgreSQL 16 已安装并运行
- 已创建数据库用户 `myblog` 和数据库 `myblog`

### 10. 数据库初始化 ✨ (2026-04-06 新增)

✅ 完成数据库初始化：
- 授予 myblog 用户 SUPERUSER 权限
- 执行 Prisma 迁移：`prisma migrate dev --name init`
- 所有表结构创建成功
- 运行种子脚本：`prisma db seed`
- 管理员用户创建成功 (admin / admin123)

### 11. 后端服务启动与测试 ✨ (2026-04-06 新增)

✅ 修复的问题：
- Prisma 版本不匹配：统一 prisma 和 @prisma/client 到 5.20.0
- ApiError 参数顺序错误：修复 auth.middleware.ts 中的参数顺序
- 限流中间件位置：将 /healthz 移到限流之前，提高测试限流限制

✅ 后端服务成功启动：
- 服务运行在 http://localhost:4000
- 健康检查端点正常：
  - /healthz → OK
  - /api/health → {"status":"healthy"}
  - /api/ready → {"success":true,"data":{"status":"ready"}}

✅ API 模块全面测试通过：
- 认证模块：CSRF Token、登录、获取当前用户、登出
- 分类模块：CRUD 完整测试
- 标签模块：CRUD 完整测试
- 文章模块：CRUD、搜索完整测试

✅ 创建的测试文件：
- `test-api.sh` - 完整的 API 测试脚本
- `simple-test.sh` - 简化的核心功能测试脚本
- `cleanup-test-data.sh` - 测试数据清理脚本

---

## 二、遇到的问题与解决方案

### 问题 1: Docker Hub 镜像拉取失败

**问题描述**:
- 无法从 Docker Hub 拉取 postgres:16-alpine 镜像
- 错误: `dial tcp 202.160.130.117:443: i/o timeout`

**尝试的解决方案**:
1. 配置 Docker 镜像源（ustc 镜像源）- 未成功
2. 尝试直接拉取镜像 - 网络超时

**当前状态**: ⚠️ 未解决（网络环境问题）

**替代方案**:
- 直接在宿主机安装 PostgreSQL 16
- 已完成 PostgreSQL 本地安装
- 已创建数据库用户 `myblog` 和数据库 `myblog`
- 下次开发继续尝试解决 Docker 镜像问题

### 问题 2: Prisma Client 版本不匹配 (已解决 ✅)

**问题描述**:
- `prisma@5.22.0` 和 `@prisma/client@5.20.0` 版本不匹配
- 可能导致意外行为

**解决方案**:
- 统一两个包版本到 5.20.0
- 重新安装依赖
- 重新生成 Prisma Client

**当前状态**: ✅ 已解决

### 问题 3: Prisma Client 导出错误 (已解决 ✅)

**问题描述**:
- 从 @prisma/client 导入 PostStatus 时报错
- 错误: "The requested module '@prisma/client' does not provide an export named 'PostStatus'"

**根本原因**:
- apps/api 使用的 @prisma/client 版本与根目录不同
- workspace 依赖链接到错误的版本

**解决方案**:
- 统一 prisma 和 @prisma/client 版本到 5.20.0
- 删除 node_modules 和 pnpm-lock.yaml
- 重新安装所有依赖
- 重新生成 Prisma Client

**当前状态**: ✅ 已解决

### 问题 4: ApiError 参数顺序错误 (已解决 ✅)

**问题描述**:
- auth.middleware.ts 中调用 ApiError 时参数顺序错误
- 构造函数签名: ApiError(message, statusCode, code)
- 实际调用: ApiError(statusCode, message)

**解决方案**:
- 修复所有 auth.middleware.ts 中的 ApiError 调用
- 确保参数顺序正确

**当前状态**: ✅ 已解决

### 问题 5: 端口被占用 (已解决 ✅)

**问题描述**:
- 4000 端口被之前的进程占用
- 错误: "Error: listen EADDRINUSE: address already in use 0.0.0.0:4000"

**解决方案**:
- 查找并杀死占用端口的进程: `lsof -ti :4000 | xargs -r kill -9`
- 重新启动服务

**当前状态**: ✅ 已解决

---

## 三、当前状态

### 已完成
- ✅ M0: 项目搭建（架构设计、项目结构、Docker配置）
- ✅ M1: 后端 API 核心模块完成
- ✅ Prisma Schema 设计完成
- ✅ 本地 PostgreSQL 数据库安装完成
- ✅ 数据库迁移和种子数据完成
- ✅ 项目依赖安装完成
- ✅ Prisma Client 生成完成
- ✅ 后端 API 框架和核心模块完成
- ✅ 前端基础框架和页面结构完成
- ✅ 后端服务成功启动并测试通过

### 进行中
- ✅ 后端服务运行中 (http://localhost:4000)

### 待完成
- ❌ Docker 镜像拉取问题解决（下次开发）
- ❌ 前端页面完善和联调
- ❌ 媒体上传功能
- ❌ 评论功能

---

## 四、后续计划

### 短期计划
1. **启动前端服务进行联调**
   - 启动 Next.js 前端服务
   - 前后端联调测试
   - 完善前端页面功能

2. **完善功能测试**
   - 测试媒体上传功能
   - 测试评论功能
   - 端到端功能测试

3. **代码优化和文档**
   - 完善代码注释
   - 添加 API 文档
   - 编写单元测试

### 长期计划
- 按架构计划完成 M1-M4 里程碑
- 最终实现生产级博客系统

---

## 五、关键文件清单

| 文件路径 | 说明 |
|----------|------|
| `blog_v2_architecture_plan.md` | 完整架构方案 |
| `blog_v2_detailed_plan.md` | 详细实现计划 |
| `DEVELOPMENT_PROGRESS.md` | 开发进展总结（本文件） |
| `prisma/schema.prisma` | 数据模型 |
| `prisma/seed.ts` | 种子数据脚本 |
| `docker-compose.yml` | Docker 开发环境 |
| `docker-compose.prod.yml` | Docker 生产环境 |
| `apps/api/src/main.ts` | 后端入口文件 |
| `apps/api/src/modules/auth/` | 认证模块 |
| `apps/api/src/modules/posts/` | 文章模块 |
| `apps/api/src/modules/categories/` | 分类模块 |
| `apps/api/src/modules/tags/` | 标签模块 |
| `apps/web/src/app/` | 前端页面 |
| `.env` | 环境变量配置 |
| `test-api.sh` | API 完整测试脚本 |
| `simple-test.sh` | API 简单测试脚本 |
| `cleanup-test-data.sh` | 测试数据清理脚本 |

---

## 六、Git 状态

- 项目已初始化 Git 仓库
- 已有基础提交
- 本次有大量代码变更待提交

---

**总结**: 项目进展非常顺利，已完成 M0 阶段全部工作和 M1 阶段后端核心功能。数据库已成功初始化，后端服务已启动并通过全面测试。所有 API 模块（认证、分类、标签、文章）都已验证可用。下一步可以启动前端服务进行联调测试。
