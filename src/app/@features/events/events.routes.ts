import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list-events/list-events.component').then((m) => m.ListEventsComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create-event/create-event.component').then((m) => m.CreateEventComponent),
  },
  {
    path: 'view/:id',
    loadComponent: () =>
      import('./pages/view-event/view-event.component').then((m) => m.ViewEventComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/create-event/create-event.component').then((m) => m.CreateEventComponent),
  },
];
