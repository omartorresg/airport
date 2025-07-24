// src/modules/quejas/ReporteQuejas.tsx

import React, { useEffect, useState } from 'react';
import './ReporteQuejas.css';

type Queja = {
  id: number;
  categoria: string;
  asignadoA: string;
  prioridad: string;
};

const mockData: Queja[] = [
  { id: 1, categoria: 'Atención', asignadoA: 'Agente 1', prioridad: 'Alta' },
  { id: 2, categoria: 'Servicio', asignadoA: 'Agente 2', prioridad: 'Media' },
  { id: 3, categoria: 'Instalaciones', asignadoA: 'Supervisor', prioridad: 'Baja' },
  { id: 4, categoria: 'Servicio', asignadoA: 'Agente 1', prioridad: 'Alta' },
];

export default function ReporteQuejas() {
  const [total, setTotal] = useState(0);
  const [porCategoria, setPorCategoria] = useState<Record<string, number>>({});
  const [porAgente, setPorAgente] = useState<Record<string, number>>({});
  const [porPrioridad, setPorPrioridad] = useState<Record<string, number>>({});

  useEffect(() => {
    setTotal(mockData.length);

    const categorias: Record<string, number> = {};
    const agentes: Record<string, number> = {};
    const prioridades: Record<string, number> = {};

    mockData.forEach((q) => {
      categorias[q.categoria] = (categorias[q.categoria] || 0) + 1;
      agentes[q.asignadoA] = (agentes[q.asignadoA] || 0) + 1;
      prioridades[q.prioridad] = (prioridades[q.prioridad] || 0) + 1;
    });

    setPorCategoria(categorias);
    setPorAgente(agentes);
    setPorPrioridad(prioridades);
  }, []);

  return (
    <div className="reporte-container">
      <h2>📋 Reporte de Quejas</h2>

      <div className="reporte-cuadro">
        <p><strong>Total de Quejas:</strong> {total}</p>

        <h3>Por Categoría</h3>
        <ul>
          {Object.entries(porCategoria).map(([cat, count]) => (
            <li key={cat}>{cat}: {count}</li>
          ))}
        </ul>

        <h3>Por Asignado</h3>
        <ul>
          {Object.entries(porAgente).map(([agente, count]) => (
            <li key={agente}>{agente}: {count}</li>
          ))}
        </ul>

        <h3>Por Prioridad</h3>
        <ul>
          {Object.entries(porPrioridad).map(([prio, count]) => (
            <li key={prio}>{prio}: {count}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
