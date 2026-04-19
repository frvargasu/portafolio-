import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <div class="logo">
              <mat-icon>inventory_2</mat-icon>
              <span>Inventario PYME</span>
            </div>
          </mat-card-title>
          <mat-card-subtitle>Crear Cuenta</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (error()) {
            <div class="alert alert-error">
              {{ error() }}
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre completo</mat-label>
              <input matInput formControlName="nombre" placeholder="Tu nombre">
              <mat-icon matSuffix>person</mat-icon>
              @if (registerForm.get('nombre')?.hasError('required') && registerForm.get('nombre')?.touched) {
                <mat-error>El nombre es requerido</mat-error>
              }
              @if (registerForm.get('nombre')?.hasError('minlength') && registerForm.get('nombre')?.touched) {
                <mat-error>Mínimo 3 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email" placeholder="ejemplo@correo.com">
              <mat-icon matSuffix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>El correo es requerido</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Ingrese un correo válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>La contraseña es requerida</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                <mat-error>Mínimo 6 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar contraseña</mat-label>
              <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword">
              <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword.set(!hideConfirmPassword())">
                <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Confirme la contraseña</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Las contraseñas no coinciden</mat-error>
              }
            </mat-form-field>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              class="full-width submit-btn"
              [disabled]="loading() || registerForm.invalid">
              @if (loading()) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                Crear Cuenta
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="login-link">
            ¿Ya tienes cuenta? 
            <a routerLink="/auth/login">Inicia sesión</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 16px;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 32px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 500;
      color: #3f51b5;
      margin-bottom: 8px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
    }

    mat-card-subtitle {
      font-size: 16px !important;
      margin-top: 8px;
    }

    mat-card-content {
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .submit-btn {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
    }

    .alert {
      margin-bottom: 16px;
    }

    mat-card-actions {
      text-align: center;
      padding-top: 16px;
    }

    .login-link {
      color: #666;
      
      a {
        color: #3f51b5;
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { nombre, email, password } = this.registerForm.value;

    this.authService.register({ nombre, email, password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al crear la cuenta');
      }
    });
  }
}
