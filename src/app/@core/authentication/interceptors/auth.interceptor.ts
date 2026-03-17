import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, retry, timer } from 'rxjs';
import { AuthService } from '@features/auth/services/auth.service';
import { AlertService } from '../../services/alert.service';
import { IdleManagerService } from '../../services/idle-manager.service';

let isNavigatingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const alertService = inject(AlertService);
  const idleManagerService = inject(IdleManagerService);
  const token = authService.getAccessToken();

  if (req.url.includes('/auth/login') || req.url.includes('/public')) {
    return next(req);
  }

  const isFormData = req.body instanceof FormData;
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        },
      })
    : req;

  return next(authReq).pipe(
    retry({
      count: 1,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse && error.status >= 400) {
          return throwError(() => error);
        }
        return timer(1000 * retryCount);
      },
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        handle401Error(error, authService, router, alertService, idleManagerService);
      } else {
        handleOtherErrors(error, alertService);
      }
      return throwError(() => error);
    })
  );
};

function extractErrorMessage(errorBody: any): string {
  if (!errorBody?.message) return '';
  if (typeof errorBody.message === 'string') return errorBody.message;
  if (typeof errorBody.message === 'object' && errorBody.message !== null) {
    try {
      return JSON.stringify(errorBody.message);
    } catch {
      return String(errorBody.message);
    }
  }
  return String(errorBody.message);
}

function isPermissionError(normalizedMessage: string, errorBody: any): boolean {
  const permissionKeywords = [
    'permission',
    "don't have",
    "don't have required",
    'access denied',
    'required permission',
    'not authorized',
  ];
  const hasPermissionKeyword = permissionKeywords.some((keyword) =>
    normalizedMessage.includes(keyword)
  );
  const isPermissionStatusCode =
    errorBody.statusCode === 401 && normalizedMessage.includes('permission');
  return hasPermissionKeyword || isPermissionStatusCode;
}

function handle401Error(
  error: HttpErrorResponse,
  authService: AuthService,
  router: Router,
  alertService: AlertService,
  idleManagerService: IdleManagerService
): void {
  const errorBody = error?.error || {};
  const errorMessage = extractErrorMessage(errorBody);
  const normalizedMessage = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';

  if (isPermissionError(normalizedMessage, errorBody)) {
    return;
  }
  handleUnauthorizedError(authService, router, alertService, idleManagerService);
}

function handleUnauthorizedError(
  authService: AuthService,
  router: Router,
  alertService: AlertService,
  idleManagerService: IdleManagerService
): void {
  if (isNavigatingToLogin) return;
  isNavigatingToLogin = true;
  try {
    idleManagerService.stopIdleService();
    authService.removeTokens();
    router
      .navigate(['/auth/login'])
      .then(() => {
        setTimeout(() => {
          isNavigatingToLogin = false;
        }, 1000);
      })
      .catch(() => {
        isNavigatingToLogin = false;
      });
    if (!router.url.includes('/auth/login')) {
      alertService.showErrorToast('Session expired. Please login again.');
    }
  } catch (error) {
    isNavigatingToLogin = false;
    console.error('Error during unauthorized navigation:', error);
  }
}

function handleOtherErrors(error: HttpErrorResponse, alertService: AlertService): void {
  switch (error.status) {
    case 403:
      alertService.showErrorToast("Access denied. You don't have permission for this action.");
      break;
    case 404:
      alertService.showErrorToast('Resource not found.');
      break;
    case 500:
      alertService.showErrorToast('Server error. Please try again later.');
      break;
    case 0:
      alertService.showErrorToast('Network error. Please check your connection.');
      break;
    default:
      if (error.status >= 500) {
        alertService.showErrorToast('Server error. Please try again later.');
      }
  }
}
