// src/paginas/FormQuejas.tsx

import React, { useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/FormQueja.css';

export default function FormQuejas() {
  const [formulario, setFormulario] = useState({
    id_pasajero: '',
    id_tipo: '',
    id_area: '',
    descripcion: '',
    fecha_reclamo: '',
    id_estado: '',
    id_prioridad: '',
  });

  const [mensaje, setMensaje] = useState('');

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');

    const { data, error } = await supabase.from('quejas').insert([formulario]);

    if (error) {
      setMensaje('❌ Error al registrar la queja.');
      console.error(error);
    } else {
      setMensaje('✅ Queja registrada exitosamente.');
      setFormulario({
        id_pasajero: '',
        id_tipo: '',
        id_area: '',
        descripcion: '',
        fecha_reclamo: '',
        id_estado: '',
        id_prioridad: '',
      });
    }
  };

  return (
    <div className="form-wrapper">
      <form className="form-container" onSubmit={manejarEnvio}>
        <h3 className="form-title">Registrar Nueva Queja</h3>

        {['id_pasajero', 'id_tipo', 'id_area', 'id_estado', 'id_prioridad'].map((campo) => (
          <div className="form-group" key={campo}>
            <label className="form-label">{campo.replace('id_', '').replace('_', ' ').toUpperCase()}</label>
            <input
              type="number"
              name={campo}
              value={formulario[campo as keyof typeof formulario]}
              onChange={manejarCambio}
              className="form-input"
              required
            />
          </div>
        ))}

        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={manejarCambio}
            className="form-textarea"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Fecha de Reclamo</label>
          <input
            type="date"
            name="fecha_reclamo"
            value={formulario.fecha_reclamo}
            onChange={manejarCambio}
            className="form-input"
            required
          />
        </div>

        <button type="submit" className="form-button">Registrar Queja</button>
        {mensaje && <p className={mensaje.includes('✅') ? 'resultado-ok' : 'resultado-error'}>{mensaje}</p>}
      </form>
    </div>
  );
}
