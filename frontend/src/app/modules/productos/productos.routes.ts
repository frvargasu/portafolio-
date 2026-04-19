import { Routes } from '@angular/router';

export const PRODUCTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./lista/productos-lista.component').then(m => m.ProductosListaComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () => import('./form/producto-form.component').then(m => m.ProductoFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detalle/producto-detalle.component').then(m => m.ProductoDetalleComponent)
  },
  {
    path: ':id/editar',
    loadComponent: () => import('./form/producto-form.component').then(m => m.ProductoFormComponent)
  }
];
