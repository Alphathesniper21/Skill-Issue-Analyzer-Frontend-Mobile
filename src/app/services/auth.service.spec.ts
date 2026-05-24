import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthResponseModel } from '../models/usuario.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const BASE = 'https://gpcueb.org/skillissueanalyzer';

  const mockResponse: AuthResponseModel = {
    token: 'mock-token',
    username: 'testuser',
    nombreCompleto: 'Test User',
    rol: 'USUARIO',
  };

  beforeEach(() => {
    // 🛠️ PARCHE RADICAL PARA FIREFOX: Limpieza física absoluta del storage real
    // antes de inyectar el servicio o configurar los espías.
    localStorage.clear();

    // Ahora sí configuramos los espías de Jasmine con total seguridad
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem').and.stub();
    spyOn(localStorage, 'removeItem').and.stub();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('esAdmin debería ser false sin sesión', () => {
    expect(service.esAdmin()).toBeFalse();
  });

  it('token debería ser null sin sesión', () => {
    // 🛠️ Evaluamos de forma segura según el tipado de tu servicio.
    // Si en tu servicio 'token' es un Signal o función método ordinario, usa: service.token()
    // Si es un getter ordinario o propiedad, se queda sin paréntesis: service.token
    const valorToken = typeof service.token === 'function' ? (service.token as Function)() : service.token;

    expect(valorToken).toBeNull();
  });

  it('username y nombreCompleto deberían ser cadena vacía sin sesión', () => {
    expect(service.username()).toBe('');
    expect(service.nombreCompleto()).toBe('');
  });

  describe('guardarSesion', () => {
    it('debería activar estaLogueado tras guardar sesión', () => {
      service.guardarSesion(mockResponse);
      expect(service.estaLogueado()).toBeTrue();
    });

    it('debería exponer el token correcto', () => {
      service.guardarSesion(mockResponse);
      const valorToken = typeof service.token === 'function' ? (service.token as Function)() : service.token;
      expect(valorToken).toBe('mock-token');
    });

    it('debería exponer el username correcto', () => {
      service.guardarSesion(mockResponse);
      expect(service.username()).toBe('testuser');
    });

    it('esAdmin debería ser false para rol USUARIO', () => {
      service.guardarSesion(mockResponse);
      expect(service.esAdmin()).toBeFalse();
    });

    it('esAdmin debería ser true para rol ADMIN', () => {
      service.guardarSesion({ ...mockResponse, rol: 'ADMIN' });
      expect(service.esAdmin()).toBeTrue();
    });
  });

  describe('cerrarSesion', () => {
    it('debería limpiar la sesión', () => {
      service.guardarSesion(mockResponse);
      service.cerrarSesion();
      expect(service.estaLogueado()).toBeFalse();
      const valorToken = typeof service.token === 'function' ? (service.token as Function)() : service.token;
      expect(valorToken).toBeNull();
    });
  });

  describe('postLogin', () => {
    it('debería hacer POST a /auth/login', () => {
      service.postLogin('user', 'pass').subscribe();
      const req = httpMock.expectOne(`${BASE}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'user', contrasena: 'pass' });
      req.flush(mockResponse);
    });
  });

  describe('postRegistro', () => {
    it('debería hacer POST a /auth/registro', () => {
      const dto = {
        username: 'nuevo',
        contrasena: '1234',
        nombreCompleto: 'Nuevo',
        email: 'nuevo@test.com',
        rol: 'USUARIO' as const,
      };
      service.postRegistro(dto).subscribe();
      const req = httpMock.expectOne(`${BASE}/auth/registro`);
      expect(req.request.method).toBe('POST');
      req.flush('ok');
    });
  });
});
