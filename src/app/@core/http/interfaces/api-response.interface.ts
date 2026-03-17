/**
 * Standardized API Response Interfaces
 * Matches backend response format { statusCode, status, message, data }
 */

export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface ApiErrorDetails {
  code?: string;
  details?: any;
  stack?: string;
  timestamp?: string;
  source?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  status: ResponseStatus.ERROR;
  message: string;
  error: ApiErrorDetails;
  data: null;
}

export interface ApiSuccessResponse<T = any> {
  statusCode: number;
  status: ResponseStatus.SUCCESS;
  message: string;
  data: T;
  error?: null;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.status === ResponseStatus.ERROR;
}

export function isSuccessResponse<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.status === ResponseStatus.SUCCESS;
}
