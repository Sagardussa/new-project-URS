import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/create-settings/create-settings.component').then((m) => m.CreateSettingsComponent),
  },
];

