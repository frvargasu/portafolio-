import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService } from '../../core/services/usuario.service';

function passwordsIguales(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('passwordNueva')?.value;
  const confirmar = group.get('confirmarPassword')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="cp-container">
      <div class="page-header">
        <div class="header-info">
          <h1>Cambiar contraseña</h1>
          <p class="subtitle">Actualiza tu contraseña de acceso</p>
        </div>
      </div>

      <div class="form-card">
        @if (exito()) {
          <div class="alert alert-success">
            <mat-icon>check_circle</mat-icon>
            Contraseña actualizada correctamente.
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="guardar()">
          <div class="form-field">
            <label>Contraseña actual</label>
            <div class="input-wrapper">
              <input
                [type]="mostrarActual() ? 'text' : 'password'"
                formControlName="passwordActual"
                placeholder="Tu contraseña actual">
              <button type="button" class="toggle-vis" (click)="mostrarActual.set(!mostrarActual())">
                <mat-icon>{{ mostrarActual() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (f['passwordActual'].invalid && f['passwordActual'].touched) {
              <span class="error">La contraseña actual es requerida</span>
            }
            @if (errorActual()) {
              <span class="error">{{ errorActual() }}</span>
            }
          </div>

          <div class="form-field">
            <label>Nueva contraseña</label>
            <div class="input-wrapper">
              <input
                [type]="mostrarNueva() ? 'text' : 'password'"
                formControlName="passwordNueva"
                placeholder="Mínimo 6 caracteres">
              <button type="button" class="toggle-vis" (click)="mostrarNueva.set(!mostrarNueva())">
                <mat-icon>{{ mostrarNueva() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (f['passwordNueva'].hasError('required') && f['passwordNueva'].touched) {
              <span class="error">La nueva contraseña es requerida</span>
            }
            @if (f['passwordNueva'].hasError('minlength') && f['passwordNueva'].touched) {
              <span class="error">Mínimo 6 caracteres</span>
            }
          </div>

          <div class="form-field">
            <label>Confirmar nueva contraseña</label>
            <div class="input-wrapper">
              <input
                [type]="mostrarConfirmar() ? 'text' : 'password'"
                formControlName="confirmarPassword"
                placeholder="Repite la nueva contraseña">
              <button type="button" class="toggle-vis" (click)="mostrarConfirmar.set(!mostrarConfirmar())">
                <mat-icon>{{ mostrarConfirmar() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            @if (f['confirmarPassword'].touched && form.hasError('noCoinciden')) {
              <span class="error">Las contraseñas no coinciden</span>
            }
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-guardar" [disabled]="form.invalid || guardando()">
              @if (guardando()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                Actualizar contraseña
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .cp-container {
      max-width: 480px;
      margin: 0 auto;
    }

    .page-header {
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

    .form-card {
      background: white;
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .alert-success {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #dcfce7;
      color: #16a34a;
      border-radius: 8px;
      font-size: 14px;

      mat-icon { font-size: 20px; width: 20px; height: 20px; }
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
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      input {
        flex: 1;
        padding: 10px 44px 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;

        &:focus { border-color: #818cf8; }
      }
    }

    .toggle-vis {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      display: flex;
      align-items: center;
      padding: 0;

      mat-icon { font-size: 20px; width: 20px; height: 20px; }

      &:hover { color: #6b7280; }
    }

    .error {
      font-size: 12px;
      color: #ef4444;
    }

    .form-actions {
      padding-top: 4px;
    }

    .btn-guardar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;

      &:disabled { opacity: 0.6; cursor: not-allowed; }
      &:hover:not(:disabled) { opacity: 0.9; }
    }
  `]
})
export class CambiarPasswordComponent {
  form: FormGroup;
  guardando = signal(false);
  exito = signal(false);
  errorActual = signal('');
  mostrarActual = signal(false);
  mostrarNueva = signal(false);
  mostrarConfirmar = signal(false);

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      passwordActual:    ['', Validators.required],
      passwordNueva:     ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required]
    }, { validators: passwordsIguales });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorActual.set('');
    this.exito.set(false);

    const { passwordActual, passwordNueva } = this.form.value;

    this.usuarioService.changePassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.exito.set(true);
        this.form.reset();
        this.guardando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg: string = err?.error?.message || '';
        if (msg.toLowerCase().includes('actual') || msg.toLowerCase().includes('incorrecta')) {
          this.errorActual.set(msg);
        } else {
          this.snackBar.open(msg || 'Error al cambiar la contraseña', 'Cerrar', { duration: 4000 });
        }
        this.guardando.set(false);
      }
    });
  }
}
