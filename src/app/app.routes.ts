// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, loginGuard } from './guards/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
    canActivate: [loginGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'historial',
    loadComponent: () => import('./historial/historial').then(m => m.Historial),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then(m => m.Admin),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];
