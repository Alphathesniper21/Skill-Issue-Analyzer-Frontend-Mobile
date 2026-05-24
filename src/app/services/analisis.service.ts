/**
 * @fileoverview Servicio HTTP para la gestion de analisis de codigo fuente.
 * Permite subir archivos ZIP, analizar repositorios de GitHub y consultar
 * el historial de analisis del usuario autenticado.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Analisis } from '../models/analisis.model';

/**
 * @class AnalisisService
 * @description Servicio singleton que encapsula todas las peticiones HTTP
 * relacionadas con el recurso `/analisis` del backend.
 *
 * Todas las peticiones son interceptadas automaticamente por
 * {@link JwtInterceptor} para adjuntar el token de autorizacion.
 */
@Injectable({ providedIn: 'root' })
export class AnalisisService {

  /** URL base del API REST del backend. */
  private readonly urlBase = 'https://gpcueb.org/skillissueanalyzer';

  /**
   * @param http - Cliente HTTP de Angular para realizar peticiones al backend.
   */
  constructor(private http: HttpClient) {}

  /**
   * Envia un archivo ZIP al backend para su analisis de malas practicas en Java.
   * El backend descomprime el ZIP, extrae los archivos `.java` y los envia a Claude AI.
   *
   * @param formData - FormData con el campo `archivo` que contiene el ZIP seleccionado.
   * @returns Observable que emite el objeto {@link Analisis} generado con los resultados.
   */
  analizarZip(formData: FormData): Observable<Analisis> {
    return this.http.post<Analisis>(`${this.urlBase}/analisis/zip`, formData);
  }

  /**
   * Solicita al backend el analisis de un repositorio publico de GitHub.
   * El backend clona el repositorio, extrae los `.java` y los procesa con Claude AI.
   *
   * @param repoUrl - URL publica del repositorio GitHub con formato `https://github.com/owner/repo`.
   * @returns Observable que emite el objeto {@link Analisis} generado con los resultados.
   */
  analizarGithub(repoUrl: string): Observable<Analisis> {
    return this.http.post<Analisis>(
      `${this.urlBase}/analisis/github`,
      null,
      { params: { repoUrl } }
    );
  }

  /**
   * Obtiene todos los analisis realizados por el usuario autenticado.
   *
   * @returns Observable que emite un array de {@link Analisis} ordenados por fecha descendente.
   */
  getMisAnalisis(): Observable<Analisis[]> {
    return this.http.get<Analisis[]>(`${this.urlBase}/analisis`);
  }

  /**
   * Obtiene el detalle completo de un analisis especifico por su ID.
   * Solo el propietario del analisis puede acceder a el.
   *
   * @param id - Identificador unico del analisis a consultar.
   * @returns Observable que emite el {@link Analisis} correspondiente al ID indicado.
   */
  getById(id: number): Observable<Analisis> {
    return this.http.get<Analisis>(`${this.urlBase}/analisis/${id}`);
  }

  /**
   * Elimina permanentemente un analisis del historial del usuario.
   * Solo el propietario puede eliminar su propio analisis.
   *
   * @param id - Identificador unico del analisis a eliminar.
   * @returns Observable que emite la respuesta en texto plano del backend.
   */
  eliminar(id: number): Observable<string> {
    return this.http.delete(`${this.urlBase}/analisis/${id}`, { responseType: 'text' });
  }
}
