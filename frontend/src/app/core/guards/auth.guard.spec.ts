import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

const mockRoute = {} as ActivatedRouteSnapshot;

describe('authGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  const buildService = (authenticated: boolean) => ({
    isAuthenticated: signal(authenticated),
  });

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: buildService(false) },
      ],
    });
  });

  it('debería permitir acceso cuando el usuario está autenticado', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(true) });
    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, { url: '/dashboard' } as RouterStateSnapshot)
    );
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('debería redirigir a /auth/login y retornar false cuando no está autenticado', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(false) });
    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, { url: '/dashboard' } as RouterStateSnapshot)
    );
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/dashboard' } }
    );
  });
});

describe('guestGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  const buildService = (authenticated: boolean) => ({
    isAuthenticated: signal(authenticated),
  });

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: buildService(false) },
      ],
    });
  });

  it('debería permitir acceso cuando el usuario NO está autenticado', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(false) });
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(mockRoute, {} as RouterStateSnapshot)
    );
    expect(result).toBeTrue();
  });

  it('debería redirigir a /dashboard si el usuario ya está autenticado', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(true) });
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(mockRoute, {} as RouterStateSnapshot)
    );
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});

describe('adminGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  const buildService = (authenticated: boolean, admin: boolean) => ({
    isAuthenticated: signal(authenticated),
    isAdmin: signal(admin),
  });

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: buildService(false, false) },
      ],
    });
  });

  it('debería permitir acceso cuando el usuario está autenticado y es admin', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(true, true) });
    const result = TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute, {} as RouterStateSnapshot)
    );
    expect(result).toBeTrue();
  });

  it('debería redirigir a /dashboard si no está autenticado', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(false, false) });
    const result = TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute, {} as RouterStateSnapshot)
    );
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debería redirigir a /dashboard si está autenticado pero no es admin', () => {
    TestBed.overrideProvider(AuthService, { useValue: buildService(true, false) });
    const result = TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute, {} as RouterStateSnapshot)
    );
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
