import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'X-Request-Id';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let requestId = req.headers[REQUEST_ID_HEADER.toLowerCase()] as string;
  if (!requestId) {
    requestId = uuidv4();
  }

  (req as unknown as { requestId: string }).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}

export function getRequestId(req: Request): string {
  return (req as unknown as { requestId: string }).requestId;
}
