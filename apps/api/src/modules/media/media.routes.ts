import express, { Request, Response } from 'express';
import multer from 'multer';
import { MediaService } from './media.service.js';
import { authenticate, requireRole } from '../../lib/middleware/auth.middleware.js';
import { successResponse } from '../../lib/utils/response.js';

const router = express.Router();

// 配置 multer 内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 获取所有媒体文件（需要认证）
router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const uploaderId = req.query.uploaderId as string | undefined;

    const result = await MediaService.findAll({ page, limit, uploaderId });
    res.json(successResponse(result, req.requestId));
  }
);

// 获取单个媒体文件（需要认证）
router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const media = await MediaService.findOne(req.params.id);
    if (!media) {
      return res.status(404).json({
        success: false,
        error: '媒体文件不存在',
        requestId: req.requestId
      });
    }
    res.json(successResponse({ media }, req.requestId));
  }
);

// 上传媒体文件（需要认证）
router.post(
  '/upload',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文件',
        requestId: req.requestId
      });
    }

    const altText = req.body.altText as string | undefined;
    const media = await MediaService.upload(req.file, req.user!, altText);
    res.status(201).json(successResponse({ media }, req.requestId));
  }
);

// 更新媒体文件（需要认证）
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    const media = await MediaService.update(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role
    );
    res.json(successResponse({ media }, req.requestId));
  }
);

// 删除媒体文件（需要认证）
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'AUTHOR'),
  async (req: Request, res: Response) => {
    await MediaService.delete(
      req.params.id,
      req.user!.id,
      req.user!.role
    );
    res.json(successResponse(null, req.requestId));
  }
);

export default router;
