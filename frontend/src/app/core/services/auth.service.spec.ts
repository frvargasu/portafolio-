import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, Usuario } from '../models';

const mockUsuario: Usuario = {
  id: 1,
  nombre: 'Admin',
  email: 'admin@sistema.com',
  rol: 'admin',
  activo: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const mockAuthResponse: AuthResponse = {
  token: 'fake.jwt.token',
  user: mockUsuario,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('estado inicial', () => {
    it('debería iniciar sin usuario autenticado', () => {
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.currentUser()).toBeNull();
    });

    it('debería leer sesión guardada en localStorage al inicializar', () => {
      localStorage.setItem('auth_token', 'token_previo');
      localStorage.setItem('auth_user', JSON.stringify(mockUsuario));

      // Necesita instancia nueva — el servicio lee localStorage en el constructor
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          { provide: Router, useValue: routerSpy },
        ],
      });

      const nuevoServicio = TestBed.inject(AuthService);
      expect(nuevoServicio.isAuthenticated()).toBeTrue();
      expect(nuevoServicio.currentUser()?.email).toBe('admin@sistema.com');
    });
  });

  describe('login()', () => {
    it('debería guardar token y usuario en localStorage tras login exitoso', () => {
      service.login({ email: 'admin@sistema.com', password: 'admin123' }).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: mockAuthResponse });

      expect(localStorage.getItem('auth_token')).toBe('fake.jwt.token');
      expect(localStorage.getItem('auth_user')).toContain('admin@sistema.com');
    });

    it('debería actualizar los signals tras login exitoso', () => {
      service.login({ email: 'admin@sistema.com', password: 'admin123' }).subscribe();

      httpMock.expectOne(r => r.url.includes('/auth/login'))
        .flush({ success: true, data: mockAuthResponse });

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()?.nombre).toBe('Admin');
      expect(service.isAdmin()).toBeTrue();
    });

    it('debería propagar el error si el login falla', () => {
      let errorCapturado: unknown;
      service.login({ email: 'x@x.com', password: 'wrong' })
        .subscribe({ error: (e) => errorCapturado = e });

      httpMock.expectOne(r => r.url.includes('/auth/login'))
        .flush({ message: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorCapturado).toBeTruthy();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('logout()', () => {
    it('debería limpiar localStorage, signals y redirigir a /auth/login', () => {
      localStorage.setItem('auth_token', 'fake.jwt.token');
      localStorage.setItem('auth_user', JSON.stringify(mockUsuario));

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.currentUser()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('getToken()', () => {
    it('debería retornar null si no hay token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('debería retornar el token guardado', () => {
      localStorage.setItem('auth_token', 'mi_token');
      expect(service.getToken()).toBe('mi_token');
    });
  });

  describe('isAdmin()', () => {
    it('debería retornar false si no hay usuario', () => {
      expect(service.isAdmin()).toBeFalse();
    });

    it('debería retornar true si el usuario tiene rol admin', () => {
      service.login({ email: 'admin@sistema.com', password: 'admin123' }).subscribe();
      httpMock.expectOne(r => r.url.includes('/auth/login'))
        .flush({ success: true, data: mockAuthResponse });

      expect(service.isAdmin()).toBeTrue();
    });

    it('debería retornar false si el usuario tiene rol vendedor', () => {
      const vendedorAuth = {
        ...mockAuthResponse,
        user: { ...mockUsuario, rol: 'vendedor' as const },
      };
      service.login({ email: 'v@v.com', password: '123456' }).subscribe();
      httpMock.expectOne(r => r.url.includes('/auth/login'))
        .flush({ success: true, data: vendedorAuth });

      expect(service.isAdmin()).toBeFalse();
    });
  });

  describe('forgotPassword()', () => {
    it('debería hacer POST a /auth/forgot-password', () => {
      service.forgotPassword('usuario@ejemplo.com').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/auth/forgot-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'usuario@ejemplo.com' });
      req.flush({ success: true });
    });
  });

  describe('resetPassword()', () => {
    it('debería hacer POST a /auth/reset-password/:token', () => {
      service.resetPassword('abc123token', 'nuevaClave').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/auth/reset-password/abc123token'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ password: 'nuevaClave' });
      req.flush({ success: true });
    });
  });
});
