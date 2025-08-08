import React, { useState, useEffect } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/RegistroMaleta.css';

export default function RegistroEquipaje() {
  const [formData, setFormData] = useState({
    idPasajero: '',
    cantidad: '1',
    estado: '',
  });

  const [pesos, setPesos] = useState<string[]>(['']);
  const [mensaje, setMensaje] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'cantidad') {
      const cantidad = parseInt(e.target.value);
      if (!isNaN(cantidad) && cantidad > 0) {
        const nuevosPesos = Array.from({ length: cantidad }, (_, i) => pesos[i] || '');
        setPesos(nuevosPesos);
      }
    }
  };

  const handlePesoChange = (index: number, value: string) => {
    const nuevosPesos = [...pesos];
    nuevosPesos[index] = value;
    setPesos(nuevosPesos);
  };

  const calcularPesoTotal = () => {
    return pesos.reduce((total, peso) => total + (parseFloat(peso) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pesoTotal = calcularPesoTotal();

    const { idPasajero, cantidad, estado } = formData;

    const { error } = await supabase.from('equipaje').insert([
      {
        id_pasajero: parseInt(idPasajero),
        peso_total: pesoTotal,
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
        cantidad: '1',
        estado: '',
      });
      setPesos(['']);
    }
  };

  return (
    <div className="registro-equipaje-container">
      <h2>Registro de Equipaje</h2>
      <form onSubmit={handleSubmit}>
        <label>ID Pasajero:</label>
        <input
          type="number"
          name="idPasajero"
          value={formData.idPasajero}
          onChange={handleChange}
          required
        />

        <label>Cantidad de Maletas:</label>
        <input
          type="number"
          name="cantidad"
          min="1"
          value={formData.cantidad}
          onChange={handleChange}
          required
        />

        {parseInt(formData.cantidad) > 1 ? (
          <>
            <label>Peso por Maleta (kg):</label>
            {pesos.map((peso, index) => (
              <input
                key={index}
                type="number"
                step="0.01"
                placeholder={`Maleta ${index + 1}`}
                value={peso}
                onChange={(e) => handlePesoChange(index, e.target.value)}
                required
              />
            ))}
            <p className="peso-total">Peso Total: {calcularPesoTotal()} kg</p>
          </>
        ) : (
          <>
            <label>Peso Total (kg):</label>
            <input
              type="number"
              step="0.01"
              placeholder="Peso"
              value={pesos[0] || ''}
              onChange={(e) => handlePesoChange(0, e.target.value)}
              required
            />
          </>
        )}

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
