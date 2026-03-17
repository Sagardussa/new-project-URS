import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
// Eager animation provider (required by PrimeNG until it migrates to animate.enter/leave; legacy API deprecated in v23)
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LoadingInterceptor, authInterceptor, responseInterceptor } from '@core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideEchartsCore } from 'ngx-echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([LoadingInterceptor, authInterceptor, responseInterceptor])),
    provideAnimations(),
    providePrimeNG({ 
      theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
     }),
    provideEchartsCore({
      echarts: () => import('echarts')
    })
  ]
};


