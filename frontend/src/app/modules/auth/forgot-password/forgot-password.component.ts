import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    MatProgressSpinnerModule
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
          <mat-card-subtitle>Recuperar contraseña</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (sent()) {
            <div class="success-box">
              <mat-icon class="success-icon">mark_email_read</mat-icon>
              <p>Si el correo está registrado, recibirás un enlace de recuperación en breve.</p>
              <p class="hint">Revisa también tu carpeta de spam.</p>
            </div>
          } @else {
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <p class="description">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Correo electrónico</mat-label>
                <input matInput type="email" formControlName="email" placeholder="ejemplo@correo.com">
                <mat-icon matSuffix>email</mat-icon>
                @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                  <mat-error>El correo es requerido</mat-error>
                }
                @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                  <mat-error>Ingrese un correo válido</mat-error>
                }
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                class="full-width submit-btn"
                [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <mat-spinner diameter="24"></mat-spinner>
                } @else {
                  Enviar enlace
                }
              </button>
            </form>
          }
        </mat-card-content>

        <mat-card-actions>
          <a routerLink="/auth/login" class="back-link">
            <mat-icon>arrow_back</mat-icon> Volver al inicio de sesión
          </a>
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

      mat-icon { font-size: 32px; width: 32px; height: 32px; }
    }

    mat-card-subtitle { font-size: 16px !important; margin-top: 8px; }
    mat-card-content { margin-top: 24px; }

    .description { color: #64748b; font-size: 14px; margin-bottom: 16px; }

    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 8px; }

    .submit-btn { margin-top: 16px; height: 48px; font-size: 16px; }
    .alert { margin-bottom: 16px; }

    .success-box {
      text-align: center;
      padding: 16px 0;

      .success-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #16a34a;
        margin-bottom: 16px;
      }

      p { color: #374151; margin-bottom: 8px; }
      .hint { color: #64748b; font-size: 13px; }
    }

    mat-card-actions { text-align: center; padding-top: 16px; }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #64748b;
      font-size: 13px;
      text-decoration: none;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &:hover { color: #3f51b5; }
    }
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  sent = signal(false);

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        // Mostrar mensaje genérico igual que éxito para no revelar emails
        this.loading.set(false);
        this.sent.set(true);
      }
    });
  }
}
