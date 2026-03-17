/**
 * Response Interceptor - Unwraps standardized API format { statusCode, status, message, data } -> data
 * Shows success toasts for POST/PUT/PATCH/DELETE via AlertService
 */

import { HttpInterceptorFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse, isSuccessResponse } from '../interfaces/api-response.interface';
import { AlertService } from '../../services/alert.service';

interface HttpResponseWithMetadata<T> extends HttpResponse<T> {
  _apiResponse?: ApiSuccessResponse<T>;
}

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);
  const method = req.method.toUpperCase();
  const showSuccessToast = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  return next(req).pipe(
    map((response: HttpEvent<any>) => {
      if (!(response instanceof HttpResponse)) return response;
      const body = response.body;

      if (response.status === 204 && showSuccessToast) {
        const message = body && isSuccessResponse(body) && body.message ? body.message : 'Resource deleted successfully';
        alertService.showSuccessToast(message);
        return response.clone({ body: null });
      }

      if (body && isSuccessResponse(body)) {
        const cloned = response.clone({ body: (body as ApiSuccessResponse).data }) as HttpResponseWithMetadata<any>;
        cloned._apiResponse = body as ApiSuccessResponse;
        if (showSuccessToast && response.status >= 200 && response.status < 300) {
          const message = (body as ApiSuccessResponse).message || 'Operation completed successfully';
          alertService.showSuccessToast(message);
        }
        return cloned;
      }

      return response;
    })
  );
};
