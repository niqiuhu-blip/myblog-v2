import { PrismaClient, Category } from '@prisma/client';
import { ApiError } from '../../lib/utils/error.js';

const prisma = new PrismaClient();

export class CategoriesService {
  // 创建分类
  static async create(data: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;
    parentId?: string;
  }): Promise<Category> {
    // 检查 slug 是否唯一
    const existingSlug = await prisma.category.findUnique({
      where: { slug: data.slug }
    });
    if (existingSlug) {
      throw new ApiError(400, '分类别名已存在');
    }

    // 检查 name 是否唯一
    const existingName = await prisma.category.findUnique({
      where: { name: data.name }
    });
    if (existingName) {
      throw new ApiError(400, '分类名称已存在');
    }

    // 如果有父分类，检查父分类是否存在
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        throw new ApiError(404, '父分类不存在');
      }
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        parentId: data.parentId
      }
    });
  }

  // 获取所有分类（包含层级关系）
  static async findAll(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        children: true
      }
    });
  }

  // 获取单个分类
  static async findOne(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        posts: {
          include: {
            post: true
          }
        }
      }
    });
  }

  // 通过 slug 获取分类
  static async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        posts: {
          include: {
            post: true
          }
        }
      }
    });
  }

  // 更新分类
  static async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      parentId?: string | null;
    }
  ): Promise<Category> {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new ApiError(404, '分类不存在');
    }

    // 检查 slug 唯一性（排除当前分类）
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: data.slug }
      });
      if (existing) {
        throw new ApiError(400, '分类别名已存在');
      }
    }

    // 检查 name 唯一性（排除当前分类）
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: data.name }
      });
      if (existing) {
        throw new ApiError(400, '分类名称已存在');
      }
    }

    // 检查父分类（不能设置自己为父分类）
    if (data.parentId === id) {
      throw new ApiError(400, '不能设置自己为父分类');
    }

    return prisma.category.update({
      where: { id },
      data
    });
  }

  // 删除分类
  static async delete(id: string): Promise<void> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true }
    });

    if (!category) {
      throw new ApiError(404, '分类不存在');
    }

    // 检查是否有子分类
    if (category.children.length > 0) {
      throw new ApiError(400, '请先删除子分类');
    }

    // 删除分类（会自动删除关联关系）
    await prisma.category.delete({ where: { id } });
  }
}
