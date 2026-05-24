import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AnalisisService } from '../services/analisis.service';
import { Analisis, MalaPractica, Severidad, SEVERIDAD_LABEL } from '../models/analisis.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css'],
})
export class Historial implements OnInit {
  private svc   = inject(AnalisisService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  lista      = signal<Analisis[]>([]);
  cargando   = signal(true);
  detalle    = signal<Analisis | null>(null);
  alerta     = signal<{ tipo: string; msg: string } | null>(null);

  private timer: any;

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.getMisAnalisis().subscribe({
      next: r  => { this.lista.set(r); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.toast('error', 'Error al cargar historial.'); },
    });
  }

  eliminar(a: Analisis, ev: Event) {
    ev.stopPropagation();
    if (!confirm(`¿Eliminar análisis #${a.id}?`)) return;
    this.svc.eliminar(a.id).subscribe({
      next: () => {
        this.lista.set(this.lista().filter(x => x.id !== a.id));
        if (this.detalle()?.id === a.id) this.detalle.set(null);
        this.toast('success', 'Eliminado.');
      },
      error: () => this.toast('error', 'Error al eliminar.'),
    });
  }

  toast(tipo: string, msg: string) {
    if (this.timer) clearTimeout(this.timer);
    this.alerta.set({ tipo, msg });
    this.timer = setTimeout(() => this.alerta.set(null), 3500);
  }

  scoreClass(s: number) {
    if (s >= 70) return 'score--critical';
    if (s >= 40) return 'score--high';
    if (s >= 15) return 'score--medium';
    return 'score--ok';
  }

  sevLabel(s: Severidad) { return SEVERIDAD_LABEL[s]; }

  preview(c: string) { return c.length > 80 ? c.slice(0, 80) + '...' : c; }

  fecha(iso: string) {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  irDashboard() { this.router.navigate(['/dashboard']); }
  irAdmin()     { this.router.navigate(['/admin']); }
  logout()      { this.auth.cerrarSesion(); this.router.navigate(['/']); }
}
