/**
 * @fileoverview Servicio de autenticacion de la aplicacion SkillIssueAnalyzer.
 * Gestiona el login, registro y el estado de sesion del usuario activo.
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponseModel } from '../models/usuario.model';
import { RegistroDTO } from '../models/usuario.model';

/**
 * Estructura interna que representa la sesion activa del usuario.
 * Se serializa en localStorage bajo la clave definida en {@link AuthService.KEY}.
 */
interface Sesion {
  /** Token JWT emitido por el backend al autenticar. */
  token: string;
  /** Nombre de usuario unico del autenticado. */
  username: string;
  /** Nombre completo del usuario (mapeado desde el campo "nombre" del backend). */
  nombreCompleto: string;
  /** Rol del usuario: "ADMIN" o "USUARIO". */
  rol: string;
}
/**
 * @class AuthService
 * @description Servicio singleton que centraliza toda la logica de autenticacion:
 * llamadas HTTP al backend, persistencia de la sesion en localStorage y
 * exposicion del estado de sesion mediante getters reactivos.
 *
 * Se provee en el root para estar disponible en toda la aplicacion.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** URL base del API REST del backend. */
  private readonly BASE = 'https://gpcueb.org/skillissueanalyzer';
  /** Clave utilizada para persistir la sesion en localStorage. */
  private readonly KEY  = 'sia_sesion_mobile';

  /**
   * Estado interno de la sesion actual.
   * Es `null` cuando no hay usuario autenticado.
   */
  private _sesion = signal<Sesion | null>(this._cargar());

  readonly estaLogueado  = computed(() => this._sesion() !== null);
  readonly esAdmin       = computed(() => this._sesion()?.rol === 'ADMIN');
  readonly username      = computed(() => this._sesion()?.username ?? '');
  readonly nombreCompleto = computed(() => this._sesion()?.nombreCompleto ?? '');
  readonly token         = computed(() => this._sesion()?.token ?? null);

  /**
   * Crea una instancia del servicio e intenta restaurar la sesion
   * persistida en localStorage al iniciar la aplicacion.
   *
   * @param http - Cliente HTTP de Angular para realizar peticiones al backend.
   */
  constructor(private http: HttpClient) {}

  // ── HTTP ──────────────────────────────────────────────────────────────────

  /**
   * Envia las credenciales del usuario al endpoint de login del backend.
   *
   * @param username  - Nombre de usuario registrado.
   * @param password  - Contrasena en texto plano (el transporte va cifrado por HTTPS).
   * @returns Observable que emite {@link AuthResponseModel} con el token JWT y datos del usuario.
   */
  postLogin(username: string, contrasena: string): Observable<AuthResponseModel> {
    return this.http.post<AuthResponseModel>(`${this.BASE}/auth/login`, { username, contrasena })
      .pipe(tap(r => this.guardarSesion(r)));
  }

  /**
   * Envia los datos del formulario de registro al backend para crear una cuenta nueva.
   *
   * @param dto - Objeto con los campos requeridos para el registro (username, contrasena,
   *              nombreCompleto, email, rol).
   * @returns Observable que emite la respuesta en texto plano del backend
   *          (mensaje de confirmacion o error).
   */
  postRegistro(dto: RegistroDTO): Observable<string> {
    return this.http.post(`${this.BASE}/auth/registro`, dto, { responseType: 'text' });
  }

  // ── Sesion ────────────────────────────────────────────────────────────────

  /**
   * Persiste la sesion del usuario autenticado en memoria y en localStorage.
   * Mapea los campos del response del backend al formato interno {@link Sesion}.
   *
   * @param resp - Objeto {@link AuthResponseModel} devuelto por el backend tras el login exitoso.
   */
  guardarSesion(r: AuthResponseModel) {
    const s: Sesion = { token: r.token, username: r.username, nombreCompleto: r.nombreCompleto, rol: r.rol };
    this._sesion.set(s);
    try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch {}
  }

  /**
   * Elimina la sesion activa tanto en memoria como en localStorage.
   * Debe llamarse al cerrar sesion o cuando el interceptor detecta un 401.
   */
  cerrarSesion() {
    this._sesion.set(null);
    try { localStorage.removeItem(this.KEY); } catch {}
  }

  /**
   * Intenta restaurar la sesion desde localStorage al inicializar el servicio.
   * Si el item no existe o el JSON es invalido, deja `_sesion` en `null`.
   *
   * @private
   */
  private _cargar(): Sesion | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
