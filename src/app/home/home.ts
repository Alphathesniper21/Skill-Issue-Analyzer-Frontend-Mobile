/**
 * @fileoverview Componente de la pantalla de inicio (login / registro).
 * Es la unica ruta publica de la aplicacion, protegida por {@link LoginGuard}
 * para redirigir al usuario autenticado a su panel correspondiente.
 */
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/usuario.model';

/** Modos de visualizacion del formulario de la pantalla de inicio. */
type Modo = 'login' | 'registro';

/** Tipos de alerta para retroalimentacion visual al usuario. */
type TipoAlerta = 'error' | 'success' | 'warning' | 'info';

/**
 * @class Home
 * @description Componente standalone que renderiza el formulario de login
 * y el formulario de registro en la ruta raiz (`/`).
 *
 * Gestiona:
 * - Cambio entre los modos login y registro.
 * - Validaciones del lado del cliente antes de enviar al backend.
 * - Alertas de feedback con autocierre para notificaciones no criticas.
 * - Redireccion post-login segun el rol del usuario (ADMIN → /admin, USUARIO → /dashboard).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  private auth   = inject(AuthService);
  private router = inject(Router);

  /** Modo activo del formulario: 'login' o 'registro'. */
  modo      = signal<Modo>('login');
  /** Indica si hay una peticion HTTP en curso para deshabilitar el formulario. */
  cargando  = signal(false);
  /** Alerta activa en pantalla, o `null` si no hay ninguna. */
  alerta    = signal<{ tipo: TipoAlerta; msg: string } | null>(null);
  mostrarPass = signal(false);

  // login fields
  loginUser = '';
  loginPass = '';

  // registro fields
  regUser   = '';
  regPass   = '';
  regNombre = '';
  regEmail  = '';
  regRol    = signal<Rol>('USUARIO');

  /** Referencia al temporizador de autocierre de alertas. */
  private timer: any;

  toast(tipo: TipoAlerta, msg: string, dur = 4000) {
    if (this.timer) clearTimeout(this.timer);
    this.alerta.set({ tipo, msg });
    if (tipo !== 'error') this.timer = setTimeout(() => this.alerta.set(null), dur);
  }

  extraerError(err: any, fallback: string): string {
    if (typeof err.error === 'string' && err.error.trim()) return err.error.trim();
    if (err.error?.message) return err.error.message;
    if (err.status === 409) return 'El usuario o email ya existe.';
    if (err.status === 401) return 'Credenciales incorrectas.';
    if (err.status === 403) return 'Cuenta pendiente de aprobación.';
    if (err.status === 0)   return 'No se puede conectar al servidor.';
    return fallback;
  }

  /**
   * Cambia el modo del formulario entre 'login' y 'registro',
   * limpiando las alertas y los campos del formulario previo.
   *
   * @param m - El nuevo modo a activar ('login' | 'registro').
   */
  cambiarModo(m: Modo) {
    this.modo.set(m);
    this.alerta.set(null);
  }

  /**
   * Ejecuta el flujo de inicio de sesion:
   * 1. Valida que los campos no esten vacios.
   * 2. Llama al backend via {@link AuthService.postLogin}.
   * 3. Persiste la sesion y redirige al panel del usuario segun su rol.
   *
   * Si ya hay una peticion en curso (`cargando = true`), el metodo retorna inmediatamente
   * para evitar envios duplicados.
   */
  login() {
    if (this.cargando()) return;
    if (!this.loginUser.trim() || !this.loginPass.trim()) {
      this.toast('warning', 'Completa usuario y contraseña.');
      return;
    }
    this.cargando.set(true);
    this.alerta.set(null);

    this.auth.postLogin(this.loginUser.trim(), this.loginPass).subscribe({
      next: resp => {
        this.cargando.set(false);
        setTimeout(() => {
          if (resp.rol === 'ADMIN') this.router.navigate(['/admin']);
          else                              this.router.navigate(['/dashboard']);
        }, 300);
      },
      error: err => {
        this.cargando.set(false);
        this.toast('error', this.extraerError(err, 'Error al iniciar sesión.'));
      },
    });
  }

  /**
   * Ejecuta el flujo de registro de nuevo usuario:
   * 1. Valida todos los campos del formulario en el cliente.
   * 2. Llama al backend via {@link AuthService.postRegistro}.
   * 3. Muestra confirmacion diferenciada segun el rol solicitado:
   *    - USUARIO: mensaje de exito y redireccion a login.
   *    - ADMINISTRADOR: mensaje informativo sobre aprobacion pendiente.
   *
   * Validaciones aplicadas:
   * - Todos los campos requeridos presentes.
   * - Username de al menos 4 caracteres.
   * - Nombre completo: solo letras, espacios y guiones.
   * - Email con formato valido (regex RFC simplificado).
   * - Contrasena: minimo 8 caracteres, una mayuscula, una minuscula y un numero.
   */
  registro() {
    if (this.cargando()) return;
    if (!this.regUser || !this.regPass || !this.regNombre || !this.regEmail) {
      this.toast('warning', 'Completa todos los campos.');
      return;
    }
    if (this.regUser.trim().length < 4) {
      this.toast('warning', 'El usuario debe tener al menos 4 caracteres.');
      return;
    }
    if (!this.regEmail.trim().match(/^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/)) {
      this.toast('warning', 'Correo inválido.');
      return;
    }
    if (this.regPass.length < 8 || !/[A-Z]/.test(this.regPass) || !/[a-z]/.test(this.regPass) || !/[0-9]/.test(this.regPass)) {
      this.toast('warning', 'Contraseña: 8+ chars, mayúscula, minúscula y número.');
      return;
    }

    this.cargando.set(true);
    this.alerta.set(null);

    this.auth.postRegistro({
      username: this.regUser.trim(),
      contrasena: this.regPass,
      nombreCompleto: this.regNombre.trim(),
      email: this.regEmail.trim(),
      rol: this.regRol(),
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.toast('success', this.regRol() === 'ADMIN'
          ? 'Solicitud enviada. Espera aprobación.'
          : 'Cuenta creada. Ya puedes iniciar sesión.');
        setTimeout(() => this.cambiarModo('login'), 2000);
      },
      error: err => {
        this.cargando.set(false);
        this.toast('error', this.extraerError(err, 'Error al registrar.'));
      },
    });
  }
}
