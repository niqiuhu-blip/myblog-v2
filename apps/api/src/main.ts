import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { requestIdMiddleware, REQUEST_ID_HEADER } from './lib/middleware/requestId.middleware.js';
import { errorMiddleware } from './lib/middleware/error.middleware.js';
import { validateCsrf } from './lib/middleware/auth.middleware.js';
import { logger } from './lib/utils/logger.js';
import healthRoutes from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/index.js';
import { categoriesRoutes } from './modules/categories/index.js';
import { tagsRoutes } from './modules/tags/index.js';
import { postsRoutes } from './modules/posts/index.js';
import { mediaRoutes } from './modules/media/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Request ID middleware (first!)
app.use(requestIdMiddleware);

// Health check (no logging, no rate limit)
app.get('/healthz', (_req, res) => {
  res.send('OK');
});

// Security middleware
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: process.env.CORS_ORIGIN || (NODE_ENV === 'development' ? true : undefined)
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // 提高测试时的限流限制
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: false
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// CSRF validation
app.use(validateCsrf);

// Morgan logging with requestId
morgan.token('requestId', (req) => {
  return (req as unknown as { requestId: string }).requestId || '-';
});
app.use(morgan(':date[iso] :requestId :method :url :status :response-time ms - :res[content-length]', {
  stream: {
    write: (message: string) => {
      logger.access({ raw: message.trim() });
    }
  }
}));

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/media', mediaRoutes);

// Error middleware (last!)
app.use(errorMiddleware);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API server running on port ${PORT} (${NODE_ENV})`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Readiness check: http://localhost:${PORT}/api/ready`);
});
