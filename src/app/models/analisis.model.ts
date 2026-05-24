// analisis.model.ts
export type Severidad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface MalaPractica {
  linea:       number;
  tipo:        string;
  descripcion: string;
  severidad:   Severidad;
  sugerencia:  string;
}

export interface Analisis {
  id:                 number;
  codigoFuente:       string;
  fechaAnalisis:      string;
  nombreUsuarioAutor: string;
  malasPracticas:     MalaPractica[];
  totalProblemas:     number;
  puntuacion:         number;
}

export const SEVERIDAD_LABEL: Record<Severidad, string> = {
  BAJA:    'Low',
  MEDIA:   'Medium',
  ALTA:    'High',
  CRITICA: 'Critical',
};
