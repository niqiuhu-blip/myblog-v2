import express, { Request, Response } from 'express';
import { TagsService } from './tags.service.js';
import { authenticate, requireRole } from '../../lib/middleware/auth.middleware.js';
import { successResponse } from '../../lib/utils/response.js';

const router = express.Router();

// 获取所有标签（公开）
router.get('/', async (req: Request, res: Response) => {
  const tags = await TagsService.findAll();
  res.json(successResponse({ tags }, req.requestId));
});

// 获取单个标签（公开）
router.get('/:id', async (req: Request, res: Response) => {
  const tag = await TagsService.findOne(req.params.id);
  if (!tag) {
    return res.status(404).json({
      success: false,
      error: '标签不存在',
      requestId: req.requestId
    });
  }
  res.json(successResponse({ tag }, req.requestId));
});

// 通过 slug 获取标签（公开）
router.get('/slug/:slug', async (req: Request, res: Response) => {
  const tag = await TagsService.findBySlug(req.params.slug);
  if (!tag) {
    return res.status(404).json({
      success: false,
      error: '标签不存在',
      requestId: req.requestId
    });
  }
  res.json(successResponse({ tag }, req.requestId));
});

// 创建标签（需要认证）
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const tag = await TagsService.create(req.body);
    res.status(201).json(successResponse({ tag }, req.requestId));
  }
);

// 更新标签（需要认证）
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const tag = await TagsService.update(req.params.id, req.body);
    res.json(successResponse({ tag }, req.requestId));
  }
);

// 删除标签（需要认证）
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    await TagsService.delete(req.params.id);
    res.json(successResponse(null, req.requestId));
  }
);

export default router;
