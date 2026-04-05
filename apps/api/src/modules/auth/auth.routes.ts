import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service.js';
import {
  authenticate,
  generateCsrfToken,
  loginLimiter,
  validateCsrf
} from '../../lib/middleware/auth.middleware.js';
import { successResponse } from '../../lib/utils/response.js';
import { logger } from '../../lib/utils/logger.js';

const router = express.Router();

// 获取 CSRF Token
router.get('/csrf', (req: Request, res: Response) => {
  let sessionId = req.cookies?.session_id;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 小时
    });
  }

  const csrfToken = generateCsrfToken(sessionId);
  res.json(successResponse({ csrfToken }, req.requestId));
});

// 用户登录
router.post(
  '/login',
  loginLimiter,
  validateCsrf,
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
        requestId: req.requestId
      });
    }

    const { user, token } = await AuthService.login(username, password);

    // 设置 httpOnly cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
    });

    res.json(successResponse({ user }, req.requestId));
  }
);

// 用户登出
router.post('/logout', authenticate, (req: Request, res: Response) => {
  res.clearCookie('access_token');
  logger.info({
    message: '用户登出',
    userId: req.user?.userId
  });
  res.json(successResponse(null, req.requestId));
});

// 获取当前用户信息
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const user = await AuthService.getCurrentUser(userId);
  res.json(successResponse({ user }, req.requestId));
});

export default router;
