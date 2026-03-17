import { Routes } from '@angular/router';
import { AuthGuard, AuthRedirectGuard } from '@core';
import { LayoutComponent } from '@shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/auth.routes').then(m => m.authRoutes),
    canActivate: [AuthRedirectGuard]
  },
  {
    path: '',
    component: LayoutComponent,
    loadChildren: () => import('@features/features.routes').then(m => m.featuresRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];