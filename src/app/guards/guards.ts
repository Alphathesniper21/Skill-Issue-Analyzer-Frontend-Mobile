/**
 * @fileoverview Guard de autenticacion para rutas protegidas.
 * Impide el acceso a cualquier ruta que requiera sesion activa.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional de Angular que protege rutas que requieren autenticacion.
 *
 * Flujo de decision:
 * - Si el usuario **esta autenticado** → permite el acceso (`true`).
 * - Si el usuario **no esta autenticado** → redirige a la ruta raiz (`/`).
 *
 * Uso en el enrutador:
 * ```ts
 * { path: 'dashboard', canActivate: [authGuard] }
 * ```
 *
 * @param _route  - Snapshot de la ruta activada (no utilizado).
 * @param _state  - Estado del router (no utilizado).
 * @returns `true` si el usuario esta autenticado, o un `UrlTree` que redirige a `/`.
 */

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaLogueado()) return true;
  return router.createUrlTree(['/']);
};

// admin.guard.ts
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.esAdmin()) return true;
  if (auth.estaLogueado()) return router.createUrlTree(['/dashboard']);
  return router.createUrlTree(['/']);
};

// login.guard.ts
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) return true;
  return auth.esAdmin()
    ? router.createUrlTree(['/admin'])
    : router.createUrlTree(['/dashboard']);
};
