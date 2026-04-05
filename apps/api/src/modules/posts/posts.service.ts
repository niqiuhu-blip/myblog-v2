import { PrismaClient, Post, PostStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../lib/utils/error.js';
import { PaginatedResponse } from '@myblog/shared';

const prisma = new PrismaClient();

// 生成 slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 计算阅读时长（中文约 300 字/分钟）
function calculateReadingTime(content: string): number {
  // 移除 Markdown 标记
  const plainText = content.replace(/[#*`\[\]()]/g, '');
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = plainText.split(/\s+/).filter(Boolean).length;
  const totalMinutes = Math.ceil(chineseChars / 300 + englishWords / 200);
  return Math.max(1, totalMinutes);
}

export class PostsService {
  // 创建文章
  static async create(
    data: {
      title: string;
      slug?: string;
      content: string;
      excerpt?: string;
      status?: PostStatus;
      isPinned?: boolean;
      coverImageId?: string;
      seoTitle?: string;
      seoDescription?: string;
      scheduledAt?: Date;
      categoryIds?: string[];
      tagIds?: string[];
    },
    authorId: string
  ): Promise<Post> {
    // 生成 slug
    let slug = data.slug || generateSlug(data.title);

    // 确保 slug 唯一
    let slugExists = await prisma.post.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(data.title)}-${counter}`;
      slugExists = await prisma.post.findUnique({ where: { slug } });
      counter++;
    }

    // 计算阅读时长
    const readingTime = calculateReadingTime(data.content);

    // 确定发布时间
    let publishedAt: Date | null = null;
    if (data.status === PostStatus.PUBLISHED) {
      publishedAt = new Date();
    } else if (data.status === PostStatus.SCHEDULED && data.scheduledAt) {
      publishedAt = data.scheduledAt;
    }

    return prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        status: data.status || PostStatus.DRAFT,
        isPinned: data.isPinned || false,
        readingTime,
        coverImageId: data.coverImageId,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        scheduledAt: data.scheduledAt,
        publishedAt,
        authorId,
        categories: data.categoryIds
          ? {
              create: data.categoryIds.map((categoryId) => ({
                categoryId
              }))
            }
          : undefined,
        tags: data.tagIds
          ? {
              create: data.tagIds.map((tagId) => ({
                tagId
              }))
            }
          : undefined
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: true
      }
    });
  }

  // 获取文章列表（分页）
  static async findAll(
    options: {
      page?: number;
      limit?: number;
      status?: PostStatus;
      categoryId?: string;
      tagId?: string;
      authorId?: string;
    } = {}
  ): Promise<PaginatedResponse<Post>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};

    if (options.status) {
      where.status = options.status;
    } else {
      // 默认只显示已发布的文章
      where.status = PostStatus.PUBLISHED;
    }

    if (options.categoryId) {
      where.categories = {
        some: { categoryId: options.categoryId }
      };
    }

    if (options.tagId) {
      where.tags = {
        some: { tagId: options.tagId }
      };
    }

    if (options.authorId) {
      where.authorId = options.authorId;
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          author: true
        }
      }),
      prisma.post.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages
    };
  }

  // 全文搜索文章
  static async search(
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Post>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // 使用 PostgreSQL 全文搜索
    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: PostStatus.PUBLISHED,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        },
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { publishedAt: 'desc' }
        ],
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          author: true
        }
      }),
      prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages
    };
  }

  // 获取单篇文章
  static async findOne(id: string, incrementView = false): Promise<Post | null> {
    if (incrementView) {
      // 增加阅读量
      await prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      });
    }

    return prisma.post.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: true,
        comments: {
          where: {
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  // 通过 slug 获取文章
  static async findBySlug(
    slug: string,
    incrementView = false
  ): Promise<Post | null> {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: true,
        comments: {
          where: {
            deletedAt: null,
            status: 'APPROVED'
          },
          orderBy: { path: 'asc' }
        }
      }
    });

    if (post && incrementView) {
      await prisma.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } }
      });
    }

    return post;
  }

  // 更新文章
  static async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      status?: PostStatus;
      isPinned?: boolean;
      coverImageId?: string;
      seoTitle?: string;
      seoDescription?: string;
      scheduledAt?: Date;
      categoryIds?: string[];
      tagIds?: string[];
    },
    userId: string,
    userRole: string
  ): Promise<Post> {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new ApiError(404, '文章不存在');
    }

    // 检查权限：只有作者或管理员可以编辑
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, '无权限编辑此文章');
    }

    const updateData: any = { ...data };

    // 如果更新了标题且没有指定 slug，重新生成 slug
    if (data.title && !data.slug) {
      let newSlug = generateSlug(data.title);
      let slugExists = await prisma.post.findFirst({
        where: { slug: newSlug, NOT: { id } }
      });
      let counter = 1;
      while (slugExists) {
        newSlug = `${generateSlug(data.title)}-${counter}`;
        slugExists = await prisma.post.findFirst({
          where: { slug: newSlug, NOT: { id } }
        });
        counter++;
      }
      updateData.slug = newSlug;
    }

    // 如果更新了内容，重新计算阅读时长
    if (data.content) {
      updateData.readingTime = calculateReadingTime(data.content);
    }

    // 处理发布状态
    if (data.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }

    // 处理分类和标签
    if (data.categoryIds !== undefined) {
      updateData.categories = {
        deleteMany: {},
        create: data.categoryIds.map((categoryId) => ({ categoryId }))
      };
    }

    if (data.tagIds !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: data.tagIds.map((tagId) => ({ tagId }))
      };
    }

    return prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: true
      }
    });
  }

  // 删除文章
  static async delete(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new ApiError(404, '文章不存在');
    }

    // 检查权限：只有作者或管理员可以删除
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, '无权限删除此文章');
    }

    await prisma.post.delete({ where: { id } });
  }
}
