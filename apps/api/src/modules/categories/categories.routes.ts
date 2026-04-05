import express, { Request, Response } from 'express';
import { CategoriesService } from './categories.service.js';
import { authenticate, requireRole } from '../../lib/middleware/auth.middleware.js';
import { successResponse } from '../../lib/utils/response.js';

const router = express.Router();

// 获取所有分类（公开）
router.get('/', async (req: Request, res: Response) => {
  const categories = await CategoriesService.findAll();
  res.json(successResponse({ categories }, req.requestId));
});

// 获取单个分类（公开）
router.get('/:id', async (req: Request, res: Response) => {
  const category = await CategoriesService.findOne(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      error: '分类不存在',
      requestId: req.requestId
    });
  }
  res.json(successResponse({ category }, req.requestId));
});

// 通过 slug 获取分类（公开）
router.get('/slug/:slug', async (req: Request, res: Response) => {
  const category = await CategoriesService.findBySlug(req.params.slug);
  if (!category) {
    return res.status(404).json({
      success: false,
      error: '分类不存在',
      requestId: req.requestId
    });
  }
  res.json(successResponse({ category }, req.requestId));
});

// 创建分类（需要认证）
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const category = await CategoriesService.create(req.body);
    res.status(201).json(successResponse({ category }, req.requestId));
  }
);

// 更新分类（需要认证）
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const category = await CategoriesService.update(req.params.id, req.body);
    res.json(successResponse({ category }, req.requestId));
  }
);

// 删除分类（需要认证）
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    await CategoriesService.delete(req.params.id);
    res.json(successResponse(null, req.requestId));
  }
);

export default router;
