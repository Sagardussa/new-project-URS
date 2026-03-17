import { Routes } from '@angular/router';

export const REFERRAL_CODES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list-referral-codes/list-referral-codes.component').then(
        (m) => m.ListReferralCodesComponent
      ),
  },
  {
    path: 'view/:id',
    loadComponent: () =>
      import('./pages/view-referral-code/view-referral-code.component').then(
        (m) => m.ViewReferralCodeComponent
      ),
  },
];
