import type { ApiResponse as SharedApiResponse, PaginatedResponse } from '@myblog/shared';

export function successResponse<T>(
  data: T,
  requestId: string
): SharedApiResponse<T> {
  return {
    success: true,
    data,
    requestId
  };
}

export function apiResponse<T>(
  data: T,
  requestId: string
): SharedApiResponse<T> {
  return successResponse(data, requestId);
}

export function paginatedResponse<T>(
  data: PaginatedResponse<T>,
  requestId: string
): SharedApiResponse<PaginatedResponse<T>> {
  return successResponse(data, requestId);
}
