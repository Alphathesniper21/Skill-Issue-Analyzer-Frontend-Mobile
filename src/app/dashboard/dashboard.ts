/**
 * @fileoverview Componente del panel de usuario autenticado.
 * Permite analizar codigo fuente (ZIP o GitHub) y consultar el historial
 * de analisis previos. Accesible unicamente para usuarios autenticados.
 */
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AnalisisService } from '../services/analisis.service';
import { Analisis, MalaPractica, Severidad, SEVERIDAD_LABEL } from '../models/analisis.model';

/** Pestanas disponibles en el dashboard. */
type Fuente = 'zip' | 'github';

/** Tipos de alerta para retroalimentacion visual. */
type TipoAlerta = 'error' | 'success' | 'warning';

/**
 * @class Dashboard
 * @description Componente standalone del panel principal del usuario autenticado.
 *
 * Funcionalidades:
 * - **Analisis ZIP**: carga y envia un archivo `.zip` al backend para su analisis.
 * - **Analisis GitHub**: envia la URL de un repositorio publico al backend.
 * - **Historial**: lista y gestiona los analisis previos del usuario.
 * - **Detalle**: visualiza las malas practicas detectadas en un analisis especifico.
 *
 * Utiliza `ChangeDetectorRef` para forzar la deteccion de cambios en modo zoneless.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  private svc    = inject(AnalisisService);
  readonly auth  = inject(AuthService);
  private router = inject(Router);

  fuente      = signal<Fuente>('zip');
  cargando    = signal(false);
  alerta      = signal<{ tipo: TipoAlerta; msg: string } | null>(null);
  resultado   = signal<Analisis | null>(null);
  detalle     = signal<MalaPractica | null>(null);

  // ZIP
  archivoZip  = signal<File | null>(null);
  nombreZip   = signal('');

  // GitHub
  repoUrl = '';

  private timer: any;

  toast(tipo: TipoAlerta, msg: string) {
    if (this.timer) clearTimeout(this.timer);
    this.alerta.set({ tipo, msg });
    this.timer = setTimeout(() => this.alerta.set(null), 4000);
  }

  extraerError(err: any, fallback: string): string {
    if (typeof err.error === 'string' && err.error.trim()) return err.error.trim();
    if (err.status === 0) return 'No se puede conectar al servidor.';
    return fallback;
  }

  /**
   * Maneja el evento de seleccion de archivo en el input de tipo file.
   * Valida que el archivo tenga extension `.zip` antes de asignarlo.
   *
   * @param ev - Evento del input file con el archivo seleccionado por el usuario.
   */
  onFileChange(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.zip')) { this.toast('warning', 'Solo archivos .zip'); return; }
    this.archivoZip.set(f);
    this.nombreZip.set(f.name);
    this.resultado.set(null);
  }

  /**
   * Limpia el estado del panel de analisis ZIP:
   * elimina el archivo seleccionado, el nombre y el resultado previo.
   */
  limpiar() {
    this.archivoZip.set(null);
    this.nombreZip.set('');
    this.repoUrl = '';
    this.resultado.set(null);
  }

  /**
   * Envia el archivo ZIP seleccionado al backend para su analisis.
   * Construye un `FormData` con el campo `archivo` y llama a {@link AnalisisService.analizarZip}.
   * Al completarse, refresca el historial automaticamente.
   */
  analizar() {
    if (this.fuente() === 'zip') this.analizarZip();
    else                         this.analizarGithub();
  }

  private analizarZip() {
    const f = this.archivoZip();
    if (!f) { this.toast('warning', 'Selecciona un archivo .zip'); return; }
    this.cargando.set(true);
    this.resultado.set(null);
    const fd = new FormData();
    fd.append('archivo', f);
    this.svc.analizarZip(fd).subscribe({
      next: r => { this.resultado.set(r); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.toast('error', this.extraerError(err, 'Error al analizar.')); },
    });
  }

  private analizarGithub() {
    if (!this.repoUrl.trim()) { this.toast('warning', 'Ingresa la URL del repositorio.'); return; }
    if (!this.repoUrl.startsWith('https://github.com/')) {
      this.toast('warning', 'Solo repos públicos de GitHub.');
      return;
    }
    this.cargando.set(true);
    this.resultado.set(null);
    this.svc.analizarGithub(this.repoUrl).subscribe({
      next: r => { this.resultado.set(r); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.toast('error', this.extraerError(err, 'Error al analizar repo.')); },
    });
  }

  logout() { this.auth.cerrarSesion(); this.router.navigate(['/']); }

  scoreClass(s: number) {
    if (s >= 70) return 'score--critical';
    if (s >= 40) return 'score--high';
    if (s >= 15) return 'score--medium';
    return 'score--ok';
  }
  scoreMsg(s: number) {
    if (s >= 70) return 'Certified disaster 🔥';
    if (s >= 40) return 'Significant issues 😬';
    if (s >= 15) return 'Some issues found 🤔';
    return 'Looking clean! ✨';
  }
  sevLabel(s: Severidad) { return SEVERIDAD_LABEL[s]; }
  porSeveridad(lista: MalaPractica[], s: Severidad) { return lista.filter(p => p.severidad === s); }

  irHistorial() { this.router.navigate(['/historial']); }
  irAdmin()     { this.router.navigate(['/admin']); }
}
