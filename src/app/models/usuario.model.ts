// auth-response.model.ts
export interface AuthResponseModel {
  token:          string;
  username:       string;
  nombreCompleto: string;
  rol:            'ADMIN' | 'USUARIO';
}

// usuario.model.ts
export type Rol             = 'ADMIN' | 'USUARIO';
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Usuario {
  id:               number;
  username:         string;
  nombreCompleto:   string;
  email:            string;
  rol:              Rol;
  activo:           boolean;
  estadoSolicitud:  EstadoSolicitud | null;
  fechaCreacion:    string;
}

export interface RegistroDTO {
  username:       string;
  contrasena:     string;
  nombreCompleto: string;
  email:          string;
  rol:            Rol;
}
