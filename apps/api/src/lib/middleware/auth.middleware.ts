import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { ApiError } from '../utils/error.js';
import { logger } from '../utils/logger.js';

// JWT 验证中间件
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      throw new ApiError(401, '未登录');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string; username: string; role: string };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, '无效的 token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'token 已过期');
    }
    throw error;
  }
};

// 角色验证中间件
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      throw new ApiError(401, '未登录');
    }

    if (!roles.includes(userRole)) {
      throw new ApiError(403, '权限不足');
    }

    next();
  };
};

// CSRF Token 存储（生产环境应使用 Redis）
const csrfTokens = new Map<string, { token: string; expires: number }>();

// 生成 CSRF Token
export const generateCsrfToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 小时过期
  });
  return token;
};

// CSRF 验证中间件
export const validateCsrf = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 跳过 GET、HEAD、OPTIONS 请求
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const sessionId = req.cookies?.session_id || 'default';
  const stored = csrfTokens.get(sessionId);

  if (!stored || Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    throw new ApiError(403, 'CSRF token 已过期');
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;

  if (token !== stored.token) {
    logger.warn({
      message: 'CSRF token 验证失败',
      ip: req.ip,
      path: req.path
    });
    throw new ApiError(403, 'CSRF token 无效');
  }

  next();
};

// 登录限流中间件
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 限制 10 次
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    logger.warn({
      message: '登录限流触发',
      ip: req.ip
    });
    res.status(429).json({
      error: '请求过于频繁，请稍后再试'
    });
  }
});

// 清理过期的 CSRF token（每小时执行一次）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expires) {
      csrfTokens.delete(key);
    }
  }
}, 3600000);
