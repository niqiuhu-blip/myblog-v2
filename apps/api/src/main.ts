import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { requestIdMiddleware, REQUEST_ID_HEADER } from './lib/middleware/requestId.middleware';
import { errorMiddleware } from './lib/middleware/error.middleware';
import { logger } from './lib/utils/logger';
import healthRoutes from './modules/health/health.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (behind Nginx)
app.set('trust proxy', true);

// Request ID middleware (first!)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: process.env.CORS_ORIGIN || (NODE_ENV === 'development' ? 'http://localhost:3000' : undefined)
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

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

// Routes
app.use('/api', healthRoutes);

// Health check (no logging)
app.get('/healthz', (_req, res) => {
  res.send('OK');
});

// Error middleware (last!)
app.use(errorMiddleware);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API server running on port ${PORT} (${NODE_ENV})`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Readiness check: http://localhost:${PORT}/api/ready`);
});
