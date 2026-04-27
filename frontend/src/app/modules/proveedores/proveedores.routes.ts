import { Routes } from '@angular/router';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./proveedores.component').then(m => m.ProveedoresComponent)
  }
];
