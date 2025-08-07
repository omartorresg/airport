import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../styles/tablero.css';
import { supabase } from '../SupabaseClient';

interface Vuelo {
  id_vuelo: number;
  fecha_hora_salida: string;
  cant_pasajeros: number;
}

interface Queja {
  id_queja: number;
  id_area: number;
}

interface Area {
  id_area: number;
  nombre: string;
}

const Tablero = () => {
  const [promedioVuelos, setPromedioVuelos] = useState(0);
  const [tasaQuejas, setTasaQuejas] = useState(0);
  const [quejasPorArea, setQuejasPorArea] = useState<any[]>([]);
  const [tasaOcupacion, setTasaOcupacion] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: vuelos } = await supabase.from('vuelo').select();
    const { data: quejas } = await supabase.from('quejas').select();
    const { data: areas } = await supabase.from('areas_involucradas').select();
    const { data: tickets } = await supabase.from('ticket').select();

    if (vuelos && vuelos.length > 0) {
      const fechas = vuelos.map(v => v.fecha_hora_salida.split('T')[0]);
      const vuelosPorFecha: { [key: string]: number } = {};
      fechas.forEach(f => {
        vuelosPorFecha[f] = (vuelosPorFecha[f] || 0) + 1;
      });
      const promedio = Object.values(vuelosPorFecha).reduce((a, b) => a + b, 0) / Object.keys(vuelosPorFecha).length;
      setPromedioVuelos(parseFloat(promedio.toFixed(2)));

      const ocupacion = vuelos.map(v => {
        const pasajeros = tickets?.filter(t => t.id_vuelo === v.id_vuelo && t.estado === 'emitido').length || 0;
        const total = v.cant_pasajeros || 1;
        return {
          nombre: `Vuelo ${v.id_vuelo}`,
          ocupacion: parseFloat(((pasajeros / total) * 100).toFixed(2))
        };
      });
      setTasaOcupacion(ocupacion);
    }

    if (quejas && quejas.length > 0) {
      const totalPasajeros = 1000;
      const tasa = (quejas.length / totalPasajeros) * 100;
      setTasaQuejas(parseFloat(tasa.toFixed(2)));

      const agrupadas: { [key: string]: number } = {};
      quejas.forEach(q => {
        const key = q.id_area;
        agrupadas[key] = (agrupadas[key] || 0) + 1;
      });

      const datosAreas = Object.entries(agrupadas).map(([id_area, cantidad]) => {
        const nombre = areas?.find(a => a.id_area === parseInt(id_area))?.nombre || `Área ${id_area}`;
        return { nombre, cantidad };
      });
      setQuejasPorArea(datosAreas);
    }
  };

  return (
    <> <div className="titulo-tablero">
        <h1>Dashboard Operativo</h1>
      </div>
    <div className="contenedor-table">

      <div className="contenedor-tablero">
        <div className='contenedor-estadisticas'>
<div className="dashboard-card animate">
          <div className="etiqueta">Promedio de vuelos por día:</div>
          <p style={{ fontWeight: 'bold' }}>{promedioVuelos}</p>
        </div>

        <div className="dashboard-card animate">
          <div className="etiqueta">Tasa de quejas por 100 pasajeros:</div>
          <p style={{ fontWeight: 'bold' }}>{tasaQuejas}%</p>
        </div>
          
        </div>
        

        <div className="dashboard-card animate">
          <div className="etiqueta">Quejas por área:</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quejasPorArea}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#1576c6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card animate">
          <div className="etiqueta">Tasa de ocupación de vuelos:</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tasaOcupacion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="ocupacion" fill="#ffa500" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      
    </div></>
  );
};

export default Tablero;
