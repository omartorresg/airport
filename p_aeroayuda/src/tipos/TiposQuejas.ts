
export interface Queja {
  id_queja?: number;
  id_pasajero: number;
  id_area: number;
  fecha: string;
  tipo_queja: string;
  descripcion: string;
  foto?: string;
  fecha_reclamo?: string;
  estado: string;
}
