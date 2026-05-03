import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
          <mat-card-subtitle>Nueva contraseña</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (done()) {
            <div class="success-box">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <p>¡Contraseña restablecida exitosamente!</p>
              <a routerLink="/auth/login" mat-raised-button color="primary" class="login-btn">
                Iniciar sesión
              </a>
            </div>
          } @else {
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nueva contraseña</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                  <mat-error>La contraseña es requerida</mat-error>
                }
                @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                  <mat-error>Mínimo 6 caracteres</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmar contraseña</mat-label>
                <input matInput [type]="hideConfirm() ? 'password' : 'text'" formControlName="confirm">
                <button mat-icon-button matSuffix type="button" (click)="hideConfirm.set(!hideConfirm())">
                  <mat-icon>{{ hideConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.hasError('passwordMismatch') && form.get('confirm')?.touched) {
                  <mat-error>Las contraseñas no coinciden</mat-error>
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
                  Restablecer contraseña
                }
              </button>
            </form>
          }
        </mat-card-content>
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
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 8px; }
    .submit-btn { margin-top: 16px; height: 48px; font-size: 16px; }
    .alert { margin-bottom: 16px; }

    .success-box {
      text-align: center;
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      .success-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #16a34a;
      }

      p { color: #374151; margin: 0; }

      .login-btn { width: 100%; height: 48px; font-size: 16px; }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  done = signal(false);
  hidePassword = signal(true);
  hideConfirm = signal(true);
  private token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required]
    }, { validators: (g) => {
      return g.get('password')?.value === g.get('confirm')?.value
        ? null : { passwordMismatch: true };
    }});
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    if (!this.token) {
      this.router.navigate(['/auth/login']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.authService.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'El enlace es inválido o ha expirado');
      }
    });
  }
}
