# My Blog v2

一个现代化、易扩展的个人博客系统。

## 技术栈

- **前端**: Next.js 15 + React + Tailwind CSS
- **后端**: Express + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **部署**: Docker Compose + Nginx

## 项目结构

```
myblog-v2/
├── apps/
│   ├── api/          # Express + TypeScript 后端
│   └── web/          # Next.js 前端
├── packages/
│   └── shared/       # 共享类型和工具
├── prisma/           # Prisma Schema 和迁移
├── docker/           # Docker 配置
├── data/             # 数据目录
└── logs/             # 日志目录
```

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### 本地开发

1. 启动数据库:
```bash
docker compose up -d
```

2. 安装依赖:
```bash
pnpm install
```

3. 配置环境变量:
```bash
cp .env.example .env
# 编辑 .env 文件
```

4. 初始化数据库:
```bash
pnpm db:generate
pnpm db:migrate:dev
```

5. 启动开发服务器:
```bash
# 后端 (端口 4000)
pnpm dev:api

# 前端 (端口 3000)
pnpm dev:web
```

### 生产部署

使用生产环境 docker-compose:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## 里程碑

- **M0**: 项目搭建 ✅
- **M1**: MVP 上线 (可发布文章)
- **M2**: 媒体功能 (图片管理)
- **M3**: 可扩展版 (评论 + 缓存)
- **M4**: 生产就绪 (监控 + 安全加固)

## License

MIT
