import { Routes } from '@angular/router';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./lista/ventas-lista.component').then(m => m.VentasListaComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detalle/venta-detalle.component').then(m => m.VentaDetalleComponent)
  }
];
