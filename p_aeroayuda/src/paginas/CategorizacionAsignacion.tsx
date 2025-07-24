// src/modules/quejas/CategorizacionAsignacion.tsx

import React, { useState } from 'react';
import './CategorizacionAsignacion.css';

type Queja = {
  id: number;
  descripcion: string;
  categoria: string;
  asignadoA: string;
};

const categorias = ['Servicio', 'Instalaciones', 'Atención', 'Otros'];
const personalDisponible = ['Agente 1', 'Agente 2', 'Supervisor'];

export default function CategorizacionAsignacion() {
  const [quejas, setQuejas] = useState<Queja[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [asignadoA, setAsignadoA] = useState('');

  const handleRegistrar = () => {
    const nuevaQueja: Queja = {
      id: quejas.length + 1,
      descripcion,
      categoria,
      asignadoA,
    };
    setQuejas([...quejas, nuevaQueja]);
    setDescripcion('');
    setCategoria('');
    setAsignadoA('');
  };

  return (
    <div className="modulo-quejas">
      <h2>Categorización y Asignación de Quejas</h2>
      <div className="formulario">
        <textarea
          placeholder="Descripción de la queja"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Seleccione categoría</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}>
          <option value="">Asignar a</option>
          {personalDisponible.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button onClick={handleRegistrar}>Registrar Queja</button>
      </div>

      <div className="lista-quejas">
        <h3>Quejas Registradas</h3>
        <ul>
          {quejas.map((q) => (
            <li key={q.id}>
              #{q.id} - {q.descripcion} [{q.categoria}] ➜ {q.asignadoA}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
