// src/modules/quejas/ReporteQuejas.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/ReporteQuejas.css';


export default function ReporteQuejas() {
  const [tipoReporte, setTipoReporte] = useState('estado');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cedulaPasajero, setCedulaPasajero] = useState('');

 const fetchReporte = async () => {
  setLoading(true);
  let resultado: any[] = [];

  switch (tipoReporte) {
    case 'estado': {
      const { data, error } = await supabase.from('quejas').select('estado');
      if (data) {
        const agrupado: Record<string, number> = {};
        data.forEach((q) => {
          const key = q.estado || 'Desconocido';
          agrupado[key] = (agrupado[key] || 0) + 1;
        });
        resultado = Object.entries(agrupado).map(([estado, count]) => ({ estado, cantidad: count }));
      }
      break;
    }

    case 'prioridad': {
      const { data, error } = await supabase.from('quejas').select('prioridad');
      if (data) {
        const agrupado: Record<string, number> = {};
        data.forEach((q) => {
          const key = q.prioridad || 'Sin definir';
          agrupado[key] = (agrupado[key] || 0) + 1;
        });
        resultado = Object.entries(agrupado).map(([prioridad, count]) => ({ prioridad, cantidad: count }));
      }
      break;
    }

    case 'tipo': {
      const { data } = await supabase.from('quejas').select('tipo_queja');
      if (data) {
        const agrupado: Record<string, number> = {};
        data.forEach((q) => {
          const key = q.tipo_queja || 'Otro';
          agrupado[key] = (agrupado[key] || 0) + 1;
        });
        resultado = Object.entries(agrupado).map(([tipo_queja, count]) => ({ tipo_queja, cantidad: count }));
      }
      break;
    }

    case 'area': {
      const { data } = await supabase.from('quejas').select('area_involucrada');
      if (data) {
        const agrupado: Record<string, number> = {};
        data.forEach((q) => {
          const key = q.area_involucrada || 'No especificada';
          agrupado[key] = (agrupado[key] || 0) + 1;
        });
        resultado = Object.entries(agrupado).map(([area_involucrada, count]) => ({ area_involucrada, cantidad: count }));
      }
      break;
    }

    case 'fecha': {
      if (!fechaInicio || !fechaFin) break;
      const { data } = await supabase
        .from('quejas')
        .select('*')
        .gte('fecha_creacion', fechaInicio)
        .lte('fecha_creacion', fechaFin);
      resultado = data || [];
      break;
    }

    case 'pasajero': {
      if (!cedulaPasajero) break;
      const { data } = await supabase
        .from('quejas')
        .select('*')
        .eq('cedula_pasajero', cedulaPasajero);
      resultado = data || [];
      break;
    }

    default:
      resultado = [];
  }

  setData(resultado);
  setLoading(false);
};


  return (
    <div className="reporte-container">
      <h2>📋 Reporte de Quejas</h2>

      <div className="filtros">
        <label>Tipo de Reporte:</label>
        <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)}>
          <option value="estado">Por Estado</option>
          <option value="prioridad">Por Prioridad</option>
          <option value="tipo">Por Tipo de Queja</option>
          <option value="area">Por Área Involucrada</option>
          <option value="fecha">Por Fecha</option>
          <option value="pasajero">Por Pasajero</option>
        </select>

        {tipoReporte === 'fecha' && (
          <>
            <label>Desde:</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            <label>Hasta:</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </>
        )}

        {tipoReporte === 'pasajero' && (
          <>
            <label>Cédula del Pasajero:</label>
            <input type="text" value={cedulaPasajero} onChange={(e) => setCedulaPasajero(e.target.value)} />
          </>
        )}

        <button onClick={fetchReporte} disabled={loading}>
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

      <div className="tabla-resultados">
        <h3>Resultados:</h3>
        {data.length === 0 ? (
          <p>No hay resultados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
