import { PrismaClient, Media, User } from '@prisma/client';
import { ApiError } from '../../lib/utils/error.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
const publicDir = path.join(process.cwd(), 'public');
const mediaDir = path.join(publicDir, 'media');

for (const dir of [uploadDir, publicDir, mediaDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

export class MediaService {
  // 上传媒体文件
  static async upload(
    file: Express.Multer.File,
    uploader: User,
    altText?: string
  ): Promise<Media> {
    // 验证文件类型
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, '不支持的文件类型');
    }

    // 验证文件大小
    if (file.size > maxFileSize) {
      throw new ApiError(400, '文件大小超过限制 (最大10MB)');
    }

    // 计算文件哈希
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    // 检查是否已存在相同文件
    const existingMedia = await prisma.media.findFirst({
      where: { hash }
    });
    if (existingMedia) {
      return existingMedia;
    }

    // 生成文件名
    const ext = path.extname(file.originalname) || this.getExtension(file.mimetype);
    const filename = `${hash}${ext}`;
    const storageKey = `media/${filename}`;
    const filePath = path.join(mediaDir, filename);

    // 保存文件
    fs.writeFileSync(filePath, file.buffer);

    // 生成 URL (使用相对路径，通过 Next.js 代理访问)
    const url = `/${storageKey}`;

    // 创建媒体记录
    return prisma.media.create({
      data: {
        filename,
        originalName: file.originalname,
        storageKey,
        hash,
        altText,
        mimeType: file.mimetype,
        size: file.size,
        url,
        storageType: 'LOCAL',
        uploaderId: uploader.id,
        status: 'READY'
      }
    });
  }

  // 获取所有媒体文件
  static async findAll(options?: {
    page?: number;
    limit?: number;
    uploaderId?: string;
  }): Promise<{ items: Media[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.uploaderId) {
      where.uploaderId = options.uploaderId;
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.media.count({ where })
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

  // 获取单个媒体文件
  static async findOne(id: string): Promise<Media | null> {
    return prisma.media.findUnique({
      where: { id },
      include: {
        uploader: true
      }
    });
  }

  // 更新媒体文件
  static async update(
    id: string,
    data: {
      altText?: string;
    },
    userId: string,
    userRole: string
  ): Promise<Media> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new ApiError(404, '媒体文件不存在');
    }

    // 只有上传者或管理员可以更新
    if (media.uploaderId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, '无权限操作');
    }

    return prisma.media.update({
      where: { id },
      data: {
        altText: data.altText
      }
    });
  }

  // 删除媒体文件
  static async delete(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new ApiError(404, '媒体文件不存在');
    }

    // 只有上传者或管理员可以删除
    if (media.uploaderId !== userId && userRole !== 'ADMIN') {
      throw new ApiError(403, '无权限操作');
    }

    // 删除文件
    const filePath = path.join(publicDir, media.storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await prisma.media.delete({ where: { id } });
  }

  // 根据 mimeType 获取扩展名
  private static getExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    return mimeToExt[mimeType] || '.bin';
  }
}
