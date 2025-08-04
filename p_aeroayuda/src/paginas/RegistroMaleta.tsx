import React, { useState } from 'react';
import { supabase } from '../SupabaseClient'; // Ajusta la ruta según tu estructura
import '../styles/RegistroMaleta.css';

export default function RegistroEquipaje() {
  const [formData, setFormData] = useState({
    idPasajero: '',
    pesoTotal: '',
    cantidad: '',
    estado: '',
  });

  const [mensaje, setMensaje] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { idPasajero, pesoTotal, cantidad, estado } = formData;

    const { error } = await supabase.from('equipaje').insert([
      {
        id_pasajero: parseInt(idPasajero),
        peso_total: parseFloat(pesoTotal),
        cantidad: parseInt(cantidad),
        estado: estado,
      },
    ]);

    if (error) {
      console.error('Error al registrar:', error);
      setMensaje('❌ Error al registrar el equipaje');
    } else {
      setMensaje('✅ Equipaje registrado con éxito');
      setFormData({
        idPasajero: '',
        pesoTotal: '',
        cantidad: '',
        estado: '',
      });
    }
  };

  return (
    <div className="registro-equipaje-container">
      <h2>Registro de Equipaje</h2>
      <form onSubmit={handleSubmit}>
        <label>ID Pasajero:</label>
        <input type="number" name="idPasajero" value={formData.idPasajero} onChange={handleChange} required />

        <label>Peso Total (kg):</label>
        <input type="number" name="pesoTotal" step="0.01" value={formData.pesoTotal} onChange={handleChange} required />

        <label>Cantidad de Maletas:</label>
        <input type="number" name="cantidad" value={formData.cantidad} onChange={handleChange} required />

        <label>Estado:</label>
        <select name="estado" value={formData.estado} onChange={handleChange} required>
          <option value="">Seleccione</option>
          <option value="registrado">Registrado</option>
          <option value="facturado">Facturado</option>
          <option value="entregado">Entregado</option>
        </select>

        <button type="submit">Registrar Equipaje</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}
