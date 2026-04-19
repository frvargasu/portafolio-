import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'productos',
        loadChildren: () => import('./modules/productos/productos.routes').then(m => m.PRODUCTOS_ROUTES)
      },
      {
        path: 'categorias',
        loadChildren: () => import('./modules/categorias/categorias.routes').then(m => m.CATEGORIAS_ROUTES)
      },
      {
        path: 'ventas',
        loadChildren: () => import('./modules/ventas/ventas.routes').then(m => m.VENTAS_ROUTES)
      },
      {
        path: 'pos',
        loadComponent: () => import('./modules/pos/pos.component').then(m => m.PosComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
