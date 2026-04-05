import express, { Request, Response } from 'express';
import { PostsService } from './posts.service.js';
import { authenticate, requireRole } from '../../lib/middleware/auth.middleware.js';
import { successResponse } from '../../lib/utils/response.js';
import { PostStatus } from '@prisma/client';

const router = express.Router();

// 搜索文章（公开）
router.get('/search', async (req: Request, res: Response) => {
  const { q, page, limit } = req.query;
  if (!q) {
    return res.status(400).json({
      success: false,
      error: '搜索关键词不能为空',
      requestId: req.requestId
    });
  }

  const result = await PostsService.search(q as string, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10
  });

  res.json(successResponse(result, req.requestId));
});

// 获取文章列表（公开）
router.get('/', async (req: Request, res: Response) => {
  const { page, limit, status, categoryId, tagId, authorId } = req.query;
  const result = await PostsService.findAll({
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10,
    status: status as PostStatus,
    categoryId: categoryId as string,
    tagId: tagId as string,
    authorId: authorId as string
  });

  res.json(successResponse(result, req.requestId));
});

// 获取单篇文章（公开）
router.get('/:id', async (req: Request, res: Response) => {
  const post = await PostsService.findOne(req.params.id, true);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: '文章不存在',
      requestId: req.requestId
    });
  }
  res.json(successResponse({ post }, req.requestId));
});

// 通过 slug 获取文章（公开）
router.get('/slug/:slug', async (req: Request, res: Response) => {
  const post = await PostsService.findBySlug(req.params.slug, true);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: '文章不存在',
      requestId: req.requestId
    });
  }
  res.json(successResponse({ post }, req.requestId));
});

// 创建文章（需要认证）
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const post = await PostsService.create(req.body, userId);
    res.status(201).json(successResponse({ post }, req.requestId));
  }
);

// 更新文章（需要认证）
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const post = await PostsService.update(
      req.params.id,
      req.body,
      userId,
      userRole
    );
    res.json(successResponse({ post }, req.requestId));
  }
);

// 删除文章（需要认证）
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    await PostsService.delete(req.params.id, userId, userRole);
    res.json(successResponse(null, req.requestId));
  }
);

export default router;
