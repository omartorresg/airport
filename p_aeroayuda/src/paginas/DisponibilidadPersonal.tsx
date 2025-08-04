import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/DisponibilidadPersonalQuejas.css';

export default function DisponibilidadPersonal() {
  const [personal, setPersonal] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id_personal: '',
    fecha: '',
    id_turno: '',
    disponible: true
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: personalData } = await supabase.from('personal_operativo').select('id_personal, cargo');
      const { data: turnosData } = await supabase.from('turnos').select('id_turno, descripcion');
      setPersonal(personalData || []);
      setTurnos(turnosData || []);
    };
    fetchData();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('disponibilidad_personal').insert([formData]);
    alert('Disponibilidad registrada.');
    setFormData({ id_personal: '', fecha: '', id_turno: '', disponible: true });
  };

  return (
    <div className="disponibilidad-form-container">
      <h2>Registro de Disponibilidad de Personal</h2>
      <form onSubmit={handleSubmit} className="disponibilidad-form">
        <label>Personal Operativo:</label>
        <select name="id_personal" value={formData.id_personal} onChange={handleChange} required>
          <option value="">Seleccione personal</option>
          {personal.map(p => (
            <option key={p.id_personal} value={p.id_personal}>
              {`#${p.id_personal} - ${p.cargo}`}
            </option>
          ))}
        </select>

        <label>Fecha:</label>
        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required />

        <label>Turno:</label>
        <select name="id_turno" value={formData.id_turno} onChange={handleChange} required>
          <option value="">Seleccione un turno</option>
          {turnos.map(t => (
            <option key={t.id_turno} value={t.id_turno}>{t.descripcion}</option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            name="disponible"
            checked={formData.disponible}
            onChange={handleChange}
          />
          Disponible
        </label>

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}
