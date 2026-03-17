import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { LoaderService } from '../../services/loader.service';
import { inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';

export const LoadingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const loaderService = inject(LoaderService); // Use inject to get the service

  const skipLoader = req.headers.get('X-Skip-Loader') === 'true';

  if (!skipLoader) {
    loaderService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoader) {
        loaderService.hide();
      }
    })
  );
};
