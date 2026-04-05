import { Router, Request, Response } from 'express';
import { getRequestId } from '../../lib/middleware/requestId.middleware';
import { apiResponse } from '../../lib/utils/response';

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

  return apiResponse(res, { status: 'ready' }, requestId);
});

export default router;
