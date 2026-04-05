import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../lib/utils/error.js';
import { logger } from '../../lib/utils/logger.js';

const prisma = new PrismaClient();

// 登录失败锁定配置
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// 简单类型定义
interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  // 密码加密
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // 密码验证
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // 生成 JWT
  static generateToken(user: { id: string; username: string; role: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '7d'
      }
    );
  }

  // 验证 JWT
  static verifyToken(token: string): {
    userId: string;
    username: string;
    role: string;
  } {
    return jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      username: string;
      role: string;
    };
  }

  // 用户登录
  static async login(
    username: string,
    password: string
  ): Promise<{ user: SafeUser; token: string }> {
    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      }
    });

    if (!user) {
      logger.warn({
        message: '登录失败：用户不存在',
        username
      });
      throw new ApiError(401, '用户名或密码错误');
    }

    // 检查账户状态
    if (user.status === 'INACTIVE') {
      throw new ApiError(403, '账户已被禁用');
    }

    if (user.status === 'LOCKED') {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 60000
        );
        throw new ApiError(
          403,
          `账户已锁定，请 ${remainingMinutes} 分钟后再试`
        );
      } else {
        // 锁定时间已过，解锁账户
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'ACTIVE',
            loginAttempts: 0,
            lockedUntil: null
          }
        });
      }
    }

    // 验证密码
    const passwordValid = await this.verifyPassword(password, user.password);

    if (!passwordValid) {
      const newAttempts = user.loginAttempts + 1;
      const updateData: any = {
        loginAttempts: newAttempts
      };

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.status = 'LOCKED';
        updateData.lockedUntil = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60000
        );
        logger.warn({
          message: '账户被锁定',
          userId: user.id,
          username
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      throw new ApiError(401, '用户名或密码错误');
    }

    // 登录成功，重置尝试次数并更新登录时间
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // 生成 token
    const token = this.generateToken(updatedUser);

    // 记录审计日志
    logger.info({
      message: '用户登录成功',
      userId: user.id,
      username
    });

    // 返回安全用户信息（不包含密码等敏感字段）
    const safeUser: SafeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return { user: safeUser, token };
  }

  // 获取当前用户
  static async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
