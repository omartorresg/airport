import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/PanelQuejas.css';

interface TicketResumen {
  tipo: string;
  cantidad: number;
}

interface TicketFila {
  agente: string;
  tipo: string;
  estado: string;
  tiempo: string;
  prioridad: string;
}

interface AgenteResumen {
  nombre: string;
  total: number;
  resueltos: number;
}

export default function PanelPrioridad() {
  const [resumenTipos, setResumenTipos] = useState<TicketResumen[]>([]);
  const [tablaTickets, setTablaTickets] = useState<TicketFila[]>([]);
  const [resueltas, setResueltas] = useState(0);
  const [total, setTotal] = useState(0);
  const [agentes, setAgentes] = useState<AgenteResumen[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    // Resumen por tipo de queja
    const { data: resumenTipo } = await supabase
      .from('quejas')
      .select(`
        id_queja,
        tipo:tipos_queja(nombre)
      `);

    if (resumenTipo) {
      const counts: Record<string, number> = {};
      resumenTipo.forEach((q) => {
        const tipo = q.tipo?.[0]?.nombre; // Asegúrate que es arreglo
        if (tipo) counts[tipo] = (counts[tipo] || 0) + 1;
      });
      const resumen = Object.entries(counts).map(([tipo, cantidad]) => ({ tipo, cantidad }));
      setResumenTipos(resumen);
    }

    // Tabla de tickets por prioridad
    const { data: tickets } = await supabase
      .from('quejas')
      .select(`
        fecha_reclamo,
        tipo:tipos_queja(nombre),
        estado:estados_queja(nombre_estado),
        prioridad:niveles_prioridad(nivel),
        asignacion_queja(
          personal_operativo(nombre, apellido)
        )
      `);

    if (tickets) {
      const hoy = new Date();
      const filas = tickets.map((t) => {
        const fechaReclamo = new Date(t.fecha_reclamo);
        const diffHoras = ((hoy.getTime() - fechaReclamo.getTime()) / 3600000).toFixed(2);
        const personal = t.asignacion_queja?.[0]?.personal_operativo?.[0]; // corregido
        return {
          agente: personal ? `${personal.nombre} ${personal.apellido}` : 'No asignado',
          tipo: t.tipo?.[0]?.nombre || 'Sin tipo',
          estado: t.estado?.[0]?.nombre_estado || 'Sin estado',
          prioridad: t.prioridad?.[0]?.nivel || 'Sin prioridad',
          tiempo: `${diffHoras} hrs`
        };
      });
      setTablaTickets(filas);
      setTotal(tickets.length);
      setResueltas(
        tickets.filter((t) => t.estado?.[0]?.nombre_estado?.toLowerCase() === 'resuelto').length
      );
    }

    // Desempeño por agente
    const { data: asignaciones } = await supabase
      .from('asignacion_queja')
      .select(`
        personal_operativo(nombre, apellido),
        quejas(
          estado:estados_queja(nombre_estado)
        )
      `);

    if (asignaciones) {
      const resumen: Record<string, { total: number; resueltos: number }> = {};
      asignaciones.forEach((a) => {
        const persona = a.personal_operativo?.[0]; // corregido
        const nombre = persona ? `${persona.nombre} ${persona.apellido}` : 'Sin asignar';
        if (!resumen[nombre]) resumen[nombre] = { total: 0, resueltos: 0 };
        resumen[nombre].total += 1;

        const estado = a.quejas?.[0]?.estado?.[0]?.nombre_estado; // corregido
        if (estado?.toLowerCase() === 'resuelto') {
          resumen[nombre].resueltos += 1;
        }
      });
      const listaAgentes = Object.entries(resumen).map(([nombre, stats]) => ({
        nombre,
        total: stats.total,
        resueltos: stats.resueltos,
      }));
      setAgentes(listaAgentes);
    }
  };

  return (
    <div className="panel-container">
      <h2 className="titulo-panel">Gestión de Prioridad y Desempeño - Quejas</h2>
      <div className="panel-grid centrado">

        <div className="panel-card">
          <h3>Quejas por Tipo</h3>
          <ul>
            {resumenTipos.map((item, i) => (
              <li key={i}>{item.tipo}: <strong>{item.cantidad}</strong></li>
            ))}
          </ul>
        </div>

        <div className="panel-card">
          <h3>Quejas Resueltas</h3>
          <div className="barra-resueltas">
            <div className="progreso" style={{ width: `${(resueltas / total) * 100}%` }}></div>
            <span className="barra-texto">{resueltas} Resueltas / {total} Totales</span>
          </div>
        </div>

        <div className="panel-card full-width">
          <h3>Tickets por Prioridad</h3>
          <table className="tabla-tickets">
            <thead>
              <tr>
                <th>Agente</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {tablaTickets.map((t, i) => (
                <tr key={i} className={t.prioridad.toLowerCase() === 'alta' ? 'prioridad-alta' : ''}>
                  <td>{t.agente}</td>
                  <td>{t.tipo}</td>
                  <td>{t.prioridad}</td>
                  <td>{t.estado}</td>
                  <td>{t.tiempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel-card full-width">
          <h3>Desempeño por Agente</h3>
          <table className="tabla-desempeno">
            <thead>
              <tr>
                <th>Agente</th>
                <th>Total Asignadas</th>
                <th>Resueltas</th>
              </tr>
            </thead>
            <tbody>
              {agentes.map((a, i) => (
                <tr key={i}>
                  <td>{a.nombre}</td>
                  <td>{a.total}</td>
                  <td>{a.resueltos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
