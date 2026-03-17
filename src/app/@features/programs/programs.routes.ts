import { Routes } from '@angular/router';

export const PROGRAMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list-programs/list-programs.component').then((m) => m.ListProgramsComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/manage-program/manage-program.component').then((m) => m.ManageProgramComponent),
  },
  {
    path: 'view/:id',
    loadComponent: () =>
      import('./pages/view-program/view-program.component').then((m) => m.ViewProgramComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/manage-program/manage-program.component').then((m) => m.ManageProgramComponent),
  },
];
