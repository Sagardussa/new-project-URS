/**
 * Response utility - extract metadata from API responses
 */

import { HttpEvent, HttpResponse } from '@angular/common/http';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';

interface HttpResponseWithMetadata<T> extends HttpResponse<T> {
  _apiResponse?: ApiSuccessResponse<T>;
}

export function getApiResponseMetadata<T>(event: HttpEvent<T>): ApiSuccessResponse<T> | null {
  if (event instanceof HttpResponse) {
    const r = event as HttpResponseWithMetadata<T>;
    return r._apiResponse ?? null;
  }
  return null;
}

export function getResponseMessage<T>(event: HttpEvent<T>): string | null {
  return getApiResponseMetadata(event)?.message ?? null;
}

export function getResponseStatusCode<T>(event: HttpEvent<T>): number | null {
  return getApiResponseMetadata(event)?.statusCode ?? null;
}
