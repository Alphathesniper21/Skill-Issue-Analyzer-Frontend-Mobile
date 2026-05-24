import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, adminGuard, loginGuard } from './guards';

const fakeRoute = {} as ActivatedRouteSnapshot;
const fakeState = {} as RouterStateSnapshot;

const mockRouter = {
  createUrlTree: (commands: any[]) => commands as unknown as UrlTree,
  navigate: jasmine.createSpy('navigate'),
};

// ── authGuard ────────────────────────────────────────────────────────────────
describe('authGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // En mobile, estaLogueado y esAdmin son signals (funciones llamables)
    authSpy = jasmine.createSpyObj('AuthService', ['estaLogueado', 'esAdmin', 'token']);
    authSpy.estaLogueado.and.returnValue(false);
    authSpy.esAdmin.and.returnValue(false);
    authSpy.token.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('debería permitir acceso si el usuario está logueado', () => {
    authSpy.estaLogueado.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result).toBeTrue();
  });

  it('debería redirigir a / si no está logueado', () => {
    authSpy.estaLogueado.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result).toEqual(['/'] as any);
  });
});

// ── adminGuard ───────────────────────────────────────────────────────────────
describe('adminGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['estaLogueado', 'esAdmin']);
    authSpy.estaLogueado.and.returnValue(false);
    authSpy.esAdmin.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('debería permitir acceso si es admin', () => {
    authSpy.esAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard(fakeRoute, fakeState));
    expect(result).toBeTrue();
  });

  it('debería redirigir a /dashboard si está logueado pero no es admin', () => {
    authSpy.esAdmin.and.returnValue(false);
    authSpy.estaLogueado.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard(fakeRoute, fakeState));
    expect(result).toEqual(['/dashboard'] as any);
  });

  it('debería redirigir a / si no está logueado', () => {
    authSpy.esAdmin.and.returnValue(false);
    authSpy.estaLogueado.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard(fakeRoute, fakeState));
    expect(result).toEqual(['/'] as any);
  });
});

// ── loginGuard ───────────────────────────────────────────────────────────────
describe('loginGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['estaLogueado', 'esAdmin']);
    authSpy.estaLogueado.and.returnValue(false);
    authSpy.esAdmin.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('debería permitir acceso a / si no está logueado', () => {
    authSpy.estaLogueado.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => loginGuard(fakeRoute, fakeState));
    expect(result).toBeTrue();
  });

  it('debería redirigir a /admin si está logueado como admin', () => {
    authSpy.estaLogueado.and.returnValue(true);
    authSpy.esAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => loginGuard(fakeRoute, fakeState));
    expect(result).toEqual(['/admin'] as any);
  });

  it('debería redirigir a /dashboard si está logueado como usuario normal', () => {
    authSpy.estaLogueado.and.returnValue(true);
    authSpy.esAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => loginGuard(fakeRoute, fakeState));
    expect(result).toEqual(['/dashboard'] as any);
  });
});
