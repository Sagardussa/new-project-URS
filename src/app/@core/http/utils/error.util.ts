/**
 * Error utility - extract messages/codes from standardized API errors
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse, isErrorResponse } from '../interfaces/api-response.interface';

export function getErrorMessage(
  error: HttpErrorResponse | any,
  defaultMessage: string = 'An error occurred'
): string {
  if (error?.errorMessage) return error.errorMessage;
  if (error?.error && isErrorResponse(error.error)) {
    return (error.error as ApiErrorResponse).message || defaultMessage;
  }
  if (error?.error?.message) {
    return Array.isArray(error.error.message) ? error.error.message.join(', ') : error.error.message;
  }
  if (error?.message) return error.message;
  return defaultMessage;
}

export function getErrorCode(error: HttpErrorResponse | any): string | undefined {
  if (error?.errorCode) return error.errorCode;
  if (error?.error && isErrorResponse(error.error)) {
    return (error.error as ApiErrorResponse).error?.code;
  }
  return undefined;
}

export function getErrorDetails(error: HttpErrorResponse | any): any {
  if (error?.errorDetails) return error.errorDetails;
  if (error?.error && isErrorResponse(error.error)) {
    return (error.error as ApiErrorResponse).error?.details;
  }
  return undefined;
}

export function isValidationError(error: HttpErrorResponse | any): boolean {
  return error?.status === 422 || getErrorCode(error) === 'VALIDATION_ERROR';
}

export function getValidationErrors(error: HttpErrorResponse | any): Record<string, string[]> | null {
  if (!isValidationError(error)) return null;
  const details = getErrorDetails(error);
  if (details && typeof details === 'object') {
    const out: Record<string, string[]> = {};
    Object.keys(details).forEach((field) => {
      const messages = details[field];
      out[field] = Array.isArray(messages) ? messages : [String(messages)];
    });
    return out;
  }
  return null;
}
