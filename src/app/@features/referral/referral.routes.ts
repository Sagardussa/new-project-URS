import { Routes } from "@angular/router";

export const REFERRAL_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/list-referral/list-referral.component').then((m) => m.ListReferralComponent) },
];

