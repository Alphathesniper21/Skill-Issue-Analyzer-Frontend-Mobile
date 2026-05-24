/**
 * @fileoverview Componente del panel de administracion del sistema.
 * Centraliza la gestion de usuarios, solicitudes de admin, analisis globales
 * y estadisticas del sistema. Solo accesible para usuarios con rol ADMIN.
 */
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService, EstadisticasAdmin } from '../services/admin.service';
import { Usuario } from '../models/usuario.model';
import { Analisis, SEVERIDAD_LABEL, Severidad } from '../models/analisis.model';

/** Pestanas disponibles en el panel de administracion. */
type Tab = 'stats' | 'usuarios' | 'solicitudes' | 'analisis';

/**
 * @class AdminPanel
 * @description Componente standalone del panel de administracion.
 *
 * Funcionalidades:
 * - **Overview**: estadisticas globales del sistema (usuarios, analisis, pendientes, promedio).
 * - **Usuarios**: listado con filtro, activacion/desactivacion y eliminacion de cuentas.
 * - **Solicitudes**: revision y aprobacion/rechazo de solicitudes de rol administrador.
 * - **Analisis**: visualizacion de todos los analisis realizados en el sistema.
 *
 * Utiliza `ChangeDetectorRef` para forzar la deteccion de cambios en modo zoneless.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin implements OnInit {
  private svc    = inject(AdminService);
  readonly auth  = inject(AuthService);
  private router = inject(Router);

  /** Pestana activa en el panel. */
  tab          = signal<Tab>('stats');
  /** Indica si las estadisticas se estan cargando. */
  cargando     = signal(false);
  /** Alerta activa en pantalla, o `null` si no hay ninguna. */
  alerta       = signal<{ tipo: string; msg: string } | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  /** Estadisticas globales del sistema, o `null` mientras se cargan. */
  stats        = signal<EstadisticasAdmin | null>(null);
  /** Lista de todos los usuarios registrados en el sistema. */
  usuarios     = signal<Usuario[]>([]);
  /** Lista de solicitudes de rol administrador pendientes de revision. */
  solicitudes  = signal<Usuario[]>([]);
  /** Lista de todos los analisis realizados en el sistema. */
  analisis     = signal<Analisis[]>([]);
  /** Referencia al temporizador de autocierre de alertas. */
  private timer: any;

  /**
   * Ciclo de vida Angular: carga todos los datos del panel al inicializar.
   */
  ngOnInit() { this.cargarTodo(); }

  // ── Carga ─────────────────────────────────────────────────────────────────

  /**
   * Dispara la carga de todas las secciones del panel en paralelo:
   * estadisticas, usuarios, solicitudes y analisis.
   */
  cargarTodo() {
    this.cargando.set(true);
    let pending = 4;
    const done = () => { if (--pending === 0) this.cargando.set(false); };

    this.svc.getEstadisticas().subscribe({ next: r => { this.stats.set(r); done(); }, error: done });
    this.svc.getUsuarios().subscribe({ next: r => { this.usuarios.set(r); done(); }, error: done });
    this.svc.getSolicitudesPendientes().subscribe({ next: r => { this.solicitudes.set(r); done(); }, error: done });
    this.svc.getTodosAnalisis().subscribe({ next: r => { this.analisis.set(r); done(); }, error: done });
  }
// ── Acciones sobre solicitudes ────────────────────────────────────────────

  /**
   * Aprueba la solicitud de administrador del usuario indicado.
   * Activa su cuenta, le asigna el rol ADMINISTRADOR y la remueve de la lista de solicitudes.
   * Refresca las estadisticas y la lista de usuarios.
   *
   * @param s - El {@link Usuario} solicitante a aprobar.
   */
  aprobar(id: number) {
    this.svc.aprobarSolicitud(id).subscribe({
      next: () => {
        this.solicitudes.set(this.solicitudes().filter(u => u.id !== id));
        this.toast('success', 'Solicitud aprobada.');
        this.cargarTodo();
      },
      error: () => this.toast('error', 'Error al aprobar.'),
    });
  }
  /**
   * Solicita confirmacion y rechaza la solicitud de administrador del usuario indicado.
   * Elimina al solicitante del sistema y lo remueve de la lista de solicitudes.
   * Refresca las estadisticas.
   *
   * @param s - El {@link Usuario} solicitante a rechazar.
   */
  rechazar(id: number) {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    this.svc.rechazarSolicitud(id).subscribe({
      next: () => {
        this.solicitudes.set(this.solicitudes().filter(u => u.id !== id));
        this.toast('success', 'Solicitud rechazada.');
      },
      error: () => this.toast('error', 'Error al rechazar.'),
    });
  }
// ── Acciones sobre usuarios ───────────────────────────────────────────────

  /**
   * Alterna el estado activo/inactivo de un usuario.
   * Actualiza el estado localmente sin recargar la lista completa.
   * Refresca las estadisticas tras el cambio.
   *
   * @param u - El {@link Usuario} cuyo estado se va a cambiar.
   */
  toggleEstado(u: Usuario) {
    this.svc.cambiarEstado(u.id, !u.activo).subscribe({
      next: () => {
        this.usuarios.set(this.usuarios().map(x => x.id === u.id ? { ...x, activo: !x.activo } : x));
        this.toast('success', `Usuario ${!u.activo ? 'activado' : 'desactivado'}.`);
      },
      error: () => this.toast('error', 'Error al cambiar estado.'),
    });
  }
  /**
   * Solicita confirmacion y elimina permanentemente un usuario del sistema.
   * Actualiza la lista local filtrando el usuario eliminado y refresca las estadisticas.
   *
   * @param u - El {@link Usuario} a eliminar.
   */
  eliminarUsuario(id: number) {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.svc.eliminarUsuario(id).subscribe({
      next: () => {
        this.usuarios.set(this.usuarios().filter(u => u.id !== id));
        this.toast('success', 'Usuario eliminado.');
      },
      error: () => this.toast('error', 'Error al eliminar.'),
    });
  }

  toast(tipo: string, msg: string) {
    if (this.timer) clearTimeout(this.timer);
    this.alerta.set({ tipo, msg });
    this.timer = setTimeout(() => this.alerta.set(null), 3500);
  }
  /**
   * Devuelve la clase CSS correspondiente al puntaje de skill issues de un analisis.
   *
   * @param score - Puntaje numerico del analisis (0-100+).
   * @returns Nombre de la clase CSS: 'score--critical', 'score--high', 'score--medium' o 'score--ok'.
   */
  scoreClass(s: number) {
    if (s >= 70) return 'score--critical';
    if (s >= 40) return 'score--high';
    if (s >= 15) return 'score--medium';
    return 'score--ok';
  }
  /**
   * Formatea una fecha ISO 8601 al formato legible en espanol: "dd mmm yyyy".
   *
   * @param iso - Cadena de fecha en formato ISO 8601 (ej. "2026-05-24T10:30:00").
   * @returns Fecha formateada para mostrar en tablas del panel de administracion.
   */
  fecha(iso: string) {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  irDashboard() { this.router.navigate(['/dashboard']); }
  irHistorial() { this.router.navigate(['/historial']); }
  logout()      { this.auth.cerrarSesion(); this.router.navigate(['/']); }
}
