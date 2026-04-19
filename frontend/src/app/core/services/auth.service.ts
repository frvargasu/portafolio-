import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Signals para estado reactivo
  private currentUserSignal = signal<Usuario | null>(this.getStoredUser());
  private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());

  // Computed signals públicos
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.isAuthenticatedSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.rol === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getProfile(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.API_URL}/profile`);
  }

  updateProfile(nombre: string): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.API_URL}/profile`, { nombre })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateStoredUser(response.data);
          }
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    });
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    this.currentUserSignal.set(authData.user);
    this.isAuthenticatedSignal.set(true);
  }

  private getStoredUser(): Usuario | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private updateStoredUser(user: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!token;
  }
}
