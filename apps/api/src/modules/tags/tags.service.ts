import { PrismaClient, Tag } from '@prisma/client';
import { ApiError } from '../../lib/utils/error.js';

const prisma = new PrismaClient();

export class TagsService {
  // 创建标签
  static async create(data: {
    name: string;
    slug: string;
  }): Promise<Tag> {
    // 检查 slug 是否唯一
    const existingSlug = await prisma.tag.findUnique({
      where: { slug: data.slug }
    });
    if (existingSlug) {
      throw new ApiError(400, '标签别名已存在');
    }

    // 检查 name 是否唯一
    const existingName = await prisma.tag.findUnique({
      where: { name: data.name }
    });
    if (existingName) {
      throw new ApiError(400, '标签名称已存在');
    }

    return prisma.tag.create({
      data
    });
  }

  // 获取所有标签
  static async findAll(): Promise<Tag[]> {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });
  }

  // 获取单个标签
  static async findOne(id: string): Promise<Tag | null> {
    return prisma.tag.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            post: true
          }
        }
      }
    });
  }

  // 通过 slug 获取标签
  static async findBySlug(slug: string): Promise<Tag | null> {
    return prisma.tag.findUnique({
      where: { slug },
      include: {
        posts: {
          include: {
            post: true
          }
        }
      }
    });
  }

  // 更新标签
  static async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
    }
  ): Promise<Tag> {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new ApiError(404, '标签不存在');
    }

    // 检查 slug 唯一性（排除当前标签）
    if (data.slug && data.slug !== tag.slug) {
      const existing = await prisma.tag.findUnique({
        where: { slug: data.slug }
      });
      if (existing) {
        throw new ApiError(400, '标签别名已存在');
      }
    }

    // 检查 name 唯一性（排除当前标签）
    if (data.name && data.name !== tag.name) {
      const existing = await prisma.tag.findUnique({
        where: { name: data.name }
      });
      if (existing) {
        throw new ApiError(400, '标签名称已存在');
      }
    }

    return prisma.tag.update({
      where: { id },
      data
    });
  }

  // 删除标签
  static async delete(id: string): Promise<void> {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new ApiError(404, '标签不存在');
    }

    await prisma.tag.delete({ where: { id } });
  }
}
