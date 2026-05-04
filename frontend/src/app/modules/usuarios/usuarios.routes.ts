import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./usuarios-lista.component').then(m => m.UsuariosListaComponent)
  },
  {
    path: 'cambiar-password',
    loadComponent: () => import('./cambiar-password.component').then(m => m.CambiarPasswordComponent)
  }
];
