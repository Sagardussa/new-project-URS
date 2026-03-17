import { Routes } from '@angular/router';

export const featuresRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/pages/dashboard.routes').then((r) => r.DASHBOARD_ROUTES),
  },
  {
    path: 'events',
    loadChildren: () =>
      import('./events/events.routes').then((r) => r.EVENTS_ROUTES),
  },
  {
    path: 'programs',
    loadChildren: () =>
      import('./programs/programs.routes').then((r) => r.PROGRAMS_ROUTES),
  },
  {
    path: 'rewards',
    loadChildren: () =>
      import('./rewards/rewards.routes').then((r) => r.REWARDS_ROUTES),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./settings/settings.routes').then((r) => r.SETTINGS_ROUTES),
  },
  {
    path: 'referral-codes',
    loadChildren: () =>
      import('./referral-codes/referral-codes.routes').then((r) => r.REFERRAL_CODES_ROUTES),
  },
  {
    path : 'referral',
    loadChildren : () => 
      import('./referral/referral.routes').then((m) => m.REFERRAL_ROUTES)
  }
];
