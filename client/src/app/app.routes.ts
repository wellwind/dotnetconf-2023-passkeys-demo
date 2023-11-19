import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full',
  },
  {
    path: 'device-register',
    loadComponent: () => import('./register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login.component').then(m => m.LoginComponent),
  }
];
