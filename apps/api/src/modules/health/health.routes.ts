import { Router, Request, Response } from 'express';
import { getRequestId } from '../../lib/middleware/requestId.middleware.js';
import { successResponse } from '../../lib/utils/response.js';

const router = Router();

// Liveness check - doesn't check dependencies
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Readiness check - checks database, storage, etc.
router.get('/ready', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const issues: string[] = [];

  // TODO: Check database connection
  // TODO: Check storage writability
  // TODO: Check queue connection

  if (issues.length > 0) {
    return res.status(503).json({
      status: 'not_ready',
      issues,
      requestId
    });
  }

  return res.json(successResponse({ status: 'ready' }, requestId));
});

export default router;
