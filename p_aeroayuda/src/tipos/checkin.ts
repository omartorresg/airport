export interface CheckInData {
    id?: string; // UUID generado por Supabase (puedes omitirlo en la inserción)
    nombre_pasajero: string;
    numero_vuelo: string;
    fecha: string; // ISO string o tipo `Date` si lo manejas así
    asiento: string;
    documento_identidad: string;
    creado_en?: string; // timestamp si usas columnas de tracking
  }
  