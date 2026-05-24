/**
 * @fileoverview Servicio HTTP para las operaciones exclusivas del panel de administracion.
 * Gestiona usuarios, solicitudes de rol administrador, analisis globales y estadisticas.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { Analisis } from '../models/analisis.model';

/**
 * Estructura de las estadisticas globales devueltas por el endpoint de administracion.
 */
export interface EstadisticasAdmin {
  /** Numero total de usuarios registrados en el sistema. */
  totalUsuarios: number;
  /** Numero total de analisis realizados por todos los usuarios. */
  totalAnalisis: number;
  /** Numero de solicitudes de cuenta administrador pendientes de revision. */
  solicitudesPendientes: number;
  /** Promedio de problemas detectados por analisis en el sistema. */
  promedioProblemas: number;
}

/**
 * @class AdminService
 * @description Servicio singleton que encapsula las peticiones HTTP del modulo
 * de administracion. Solo accesible para usuarios con rol ADMIN gracias al
 * {@link AdminGuard} aplicado en el enrutador.
 *
 * Todas las peticiones son interceptadas por {@link JwtInterceptor} para
 * adjuntar el token de autorizacion.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {

  /** URL base del API REST del backend. */
  private readonly urlBase = 'https://gpcueb.org/skillissueanalyzer';

  /**
   * @param http - Cliente HTTP de Angular para realizar peticiones al backend.
   */
  constructor(private http: HttpClient) {}

  // ── Usuarios ─────────────────────────────────────────────────────────────

  /**
   * Obtiene la lista completa de todos los usuarios registrados en el sistema.
   *
   * @returns Observable que emite un array con todos los {@link Usuario} del sistema.
   */
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.urlBase}/admin/usuarios`);
  }

  /**
   * Elimina permanentemente un usuario del sistema junto con todos sus datos asociados.
   *
   * @param id - Identificador unico del usuario a eliminar.
   * @returns Observable que emite la respuesta en texto plano del backend.
   */
  eliminarUsuario(id: number): Observable<string> {
    return this.http.delete(`${this.urlBase}/admin/usuarios/${id}`, { responseType: 'text' });
  }

  /**
   * Activa o desactiva la cuenta de un usuario sin eliminarla.
   * Un usuario desactivado no puede iniciar sesion aunque sus datos permanecen en el sistema.
   *
   * @param id     - Identificador unico del usuario a modificar.
   * @param activo - `true` para activar la cuenta, `false` para desactivarla.
   * @returns Observable que emite la respuesta en texto plano del backend.
   */
  cambiarEstado(id: number, activo: boolean): Observable<string> {
    return this.http.patch(
      `${this.urlBase}/admin/usuarios/${id}/estado`,
      { activo },
      { responseType: 'text' }
    );
  }

  // ── Solicitudes de Admin ──────────────────────────────────────────────────

  /**
   * Obtiene las solicitudes de cuenta ADMINISTRADOR pendientes de aprobacion.
   * Las solicitudes corresponden a usuarios que se registraron con rol ADMINISTRADOR
   * y aun no han sido revisadas por un admin existente.
   *
   * @returns Observable que emite un array de {@link Usuario} con estado pendiente.
   */
  getSolicitudesPendientes(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.urlBase}/admin/solicitudes`);
  }

  /**
   * Aprueba una solicitud de administrador: activa la cuenta del solicitante
   * y le asigna el rol ADMINISTRADOR en el sistema.
   *
   * @param id - Identificador unico del usuario solicitante.
   * @returns Observable que emite la respuesta en texto plano del backend.
   */
  aprobarSolicitud(id: number): Observable<string> {
    return this.http.post(
      `${this.urlBase}/admin/solicitudes/${id}/aprobar`,
      {},
      { responseType: 'text' }
    );
  }

  /**
   * Rechaza y elimina permanentemente una solicitud de administrador.
   * El usuario solicitante es removido del sistema.
   *
   * @param id - Identificador unico del usuario solicitante a rechazar.
   * @returns Observable que emite la respuesta en texto plano del backend.
   */
  rechazarSolicitud(id: number): Observable<string> {
    return this.http.post(
      `${this.urlBase}/admin/solicitudes/${id}/rechazar`,
      {},
      { responseType: 'text' }
    );
  }

  // ── Analisis ──────────────────────────────────────────────────────────────

  /**
   * Obtiene la lista completa de todos los analisis realizados en el sistema,
   * sin importar el usuario que los genero.
   *
   * @returns Observable que emite un array con todos los {@link Analisis} del sistema.
   */
  getTodosAnalisis(): Observable<Analisis[]> {
    return this.http.get<Analisis[]>(`${this.urlBase}/admin/analisis`);
  }

  // ── Estadisticas ──────────────────────────────────────────────────────────

  /**
   * Obtiene las estadisticas globales del sistema para el dashboard del administrador.
   * Incluye conteos de usuarios, analisis, solicitudes pendientes y promedio de problemas.
   *
   * @returns Observable que emite el objeto {@link EstadisticasAdmin} con los datos agregados.
   */
  getEstadisticas(): Observable<EstadisticasAdmin> {
    return this.http.get<EstadisticasAdmin>(`${this.urlBase}/admin/estadisticas`);
  }
}
