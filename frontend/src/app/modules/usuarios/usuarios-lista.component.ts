import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario, PaginatedResponse } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="usuarios-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-info">
          <h1>Usuarios</h1>
          <p class="subtitle">Administra las cuentas de vendedores</p>
        </div>
        <button class="btn-nuevo" (click)="abrirFormNuevo()">
          <mat-icon>person_add</mat-icon>
          Nuevo Usuario
        </button>
      </div>

      <!-- Formulario crear/editar -->
      @if (mostrarForm()) {
        <div class="form-card">
          <h2>{{ editandoId() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="form-grid">
              <div class="form-field">
                <label>Nombre</label>
                <input type="text" formControlName="nombre" placeholder="Nombre completo">
                @if (form.get('nombre')?.invalid && form.get('nombre')?.touched) {
                  <span class="error">El nombre es requerido</span>
                }
              </div>
              <div class="form-field">
                <label>Email</label>
                <input type="email" formControlName="email" placeholder="correo@ejemplo.com">
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <span class="error">Email válido requerido</span>
                }
              </div>
              @if (!editandoId()) {
                <div class="form-field">
                  <label>Contraseña</label>
                  <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres">
                  @if (form.get('password')?.invalid && form.get('password')?.touched) {
                    <span class="error">Mínimo 6 caracteres</span>
                  }
                </div>
              }
              <div class="form-field">
                <label>Rol</label>
                <select formControlName="rol">
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancelar" (click)="cancelar()">Cancelar</button>
              <button type="submit" class="btn-guardar" [disabled]="form.invalid || guardando()">
                @if (guardando()) {
                  <mat-spinner diameter="18"></mat-spinner>
                } @else {
                  {{ editandoId() ? 'Guardar cambios' : 'Crear usuario' }}
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Tabla -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (usuarios().length === 0) {
          <div class="empty-state">
            <mat-icon>people</mat-icon>
            <p>No hay usuarios registrados</p>
          </div>
        } @else {
          <table class="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (usuario of usuarios(); track usuario.id) {
                <tr [class.inactivo]="!usuario.activo">
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ usuario.nombre.charAt(0).toUpperCase() }}</div>
                      <span>{{ usuario.nombre }}</span>
                    </div>
                  </td>
                  <td>{{ usuario.email }}</td>
                  <td>
                    <span class="badge" [class.badge-admin]="usuario.rol === 'admin'" [class.badge-vendedor]="usuario.rol === 'vendedor'">
                      {{ usuario.rol }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-activo]="usuario.activo" [class.badge-inactivo]="!usuario.activo">
                      {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="acciones">
                      <button class="btn-icon" matTooltip="Editar" (click)="abrirFormEditar(usuario)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      @if (usuario.activo) {
                        <button class="btn-icon btn-warn" matTooltip="Desactivar" (click)="desactivar(usuario)">
                          <mat-icon>person_off</mat-icon>
                        </button>
                      } @else {
                        <button class="btn-icon btn-success" matTooltip="Activar" (click)="activar(usuario)">
                          <mat-icon>person</mat-icon>
                        </button>
                      }
                      <button class="btn-icon btn-danger" matTooltip="Eliminar" (click)="eliminar(usuario)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .usuarios-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;

      h1 {
        font-size: 24px;
        font-weight: 600;
        color: #1e1b4b;
        margin: 0;
      }

      .subtitle {
        color: #6b7280;
        margin: 4px 0 0;
        font-size: 14px;
      }
    }

    .btn-nuevo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &:hover { opacity: 0.9; }
    }

    .form-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      h2 {
        font-size: 16px;
        font-weight: 600;
        color: #1e1b4b;
        margin: 0 0 20px;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 13px;
        font-weight: 500;
        color: #374151;
      }

      input, select {
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;

        &:focus { border-color: #818cf8; }
      }

      .error {
        font-size: 12px;
        color: #ef4444;
      }
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancelar {
      padding: 10px 20px;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      color: #374151;

      &:hover { background: #e5e7eb; }
    }

    .btn-guardar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;

      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .loading-container, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
      color: #9ca3af;

      mat-icon { font-size: 48px; width: 48px; height: 48px; }
      p { font-size: 15px; }
    }

    .usuarios-table {
      width: 100%;
      border-collapse: collapse;

      th {
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 14px 16px;
        font-size: 14px;
        color: #374151;
        border-bottom: 1px solid #f3f4f6;
      }

      tr:last-child td { border-bottom: none; }

      tr.inactivo td { opacity: 0.5; }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 13px;
      flex-shrink: 0;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      &.badge-admin    { background: #ede9fe; color: #7c3aed; }
      &.badge-vendedor { background: #dbeafe; color: #1d4ed8; }
      &.badge-activo   { background: #dcfce7; color: #16a34a; }
      &.badge-inactivo { background: #fee2e2; color: #dc2626; }
    }

    .acciones {
      display: flex;
      gap: 4px;
    }

    .btn-icon {
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 8px;
      background: #f3f4f6;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &:hover { background: #e5e7eb; color: #374151; }

      &.btn-warn:hover   { background: #fef3c7; color: #d97706; }
      &.btn-danger:hover  { background: #fee2e2; color: #dc2626; }
      &.btn-success:hover { background: #dcfce7; color: #16a34a; }
    }
  `]
})
export class UsuariosListaComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  mostrarForm = signal(false);
  editandoId = signal<number | null>(null);
  guardando = signal(false);

  form: FormGroup;

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol:      ['vendedor']
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading.set(true);
    this.usuarioService.getAll().subscribe({
      next: (res: PaginatedResponse<Usuario>) => {
        this.usuarios.set(res.data);
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  abrirFormNuevo(): void {
    this.editandoId.set(null);
    this.form.reset({ rol: 'vendedor' });
    this.form.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')!.updateValueAndValidity();
    this.mostrarForm.set(true);
  }

  abrirFormEditar(usuario: Usuario): void {
    this.editandoId.set(usuario.id);
    this.form.patchValue({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.mostrarForm.set(true);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editandoId.set(null);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    const id = this.editandoId();

    if (id) {
      const { nombre, email, rol } = this.form.value;
      this.usuarioService.update(id, { nombre, email, rol }).subscribe({
        next: () => {
          this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 3000 });
          this.cancelar();
          this.cargarUsuarios();
          this.guardando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(err?.error?.message || 'Error al actualizar', 'Cerrar', { duration: 4000 });
          this.guardando.set(false);
        }
      });
    } else {
      this.usuarioService.create(this.form.value).subscribe({
        next: () => {
          this.snackBar.open('Usuario creado correctamente', 'Cerrar', { duration: 3000 });
          this.cancelar();
          this.cargarUsuarios();
          this.guardando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(err?.error?.message || 'Error al crear usuario', 'Cerrar', { duration: 4000 });
          this.guardando.set(false);
        }
      });
    }
  }

  eliminar(usuario: Usuario): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Desactivar usuario',
        mensaje: `Este registro será desactivado y no aparecerá en las búsquedas, pero su historial se conservará.`,
        labelConfirmar: 'Desactivar',
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.usuarioService.delete(usuario.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario desactivado', 'Cerrar', { duration: 3000 });
          this.cargarUsuarios();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(err?.error?.message || 'Error al desactivar', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  desactivar(usuario: Usuario): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Desactivar usuario',
        mensaje: `Este registro será desactivado y no aparecerá en las búsquedas, pero su historial se conservará.`,
        labelConfirmar: 'Desactivar',
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.usuarioService.delete(usuario.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario desactivado', 'Cerrar', { duration: 3000 });
          this.cargarUsuarios();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(err?.error?.message || 'Error al desactivar', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  activar(usuario: Usuario): void {
    this.usuarioService.update(usuario.id, { activo: true }).subscribe({
      next: () => {
        this.snackBar.open('Usuario activado', 'Cerrar', { duration: 3000 });
        this.cargarUsuarios();
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Error al activar', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
