import { Response } from 'express';
import type { ApiResponse as SharedApiResponse, PaginatedResponse } from '@myblog/shared';

export function apiResponse<T>(
  res: Response,
  data: T,
  requestId: string
): Response<SharedApiResponse<T>> {
  return res.json({
    success: true,
    data,
    requestId
  });
}

export function paginatedResponse<T>(
  res: Response,
  data: PaginatedResponse<T>,
  requestId: string
): Response<SharedApiResponse<PaginatedResponse<T>>> {
  return res.json({
    success: true,
    data,
    requestId
  });
}
