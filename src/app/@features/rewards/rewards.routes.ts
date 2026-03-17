import { Routes } from '@angular/router';

export const REWARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list-rewards/list-rewards.component').then((m) => m.ListRewardsComponent),
  },
];
