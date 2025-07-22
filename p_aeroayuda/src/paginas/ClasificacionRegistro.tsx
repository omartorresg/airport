import React, { useState } from 'react';
import '../styles/clasificacion.css';

const ClasificacionRegistro = () => {
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  const manejarEnvio = () => {
    if (tipoEmergencia && severidad && fecha && hora && ubicacion) {
      setMensajeConfirmacion('✅ Emergencia registrada correctamente.');
    } else {
      alert('Por favor, completa todos los campos.');
    }
  };

  return (
    <div className="contenedor">
      <div className="titulo-container">
        <h1 className="titulo-verificacion">
          Clasificación <br /> y Registro <br /> de Emergencias
        </h1>
      </div>

      <div className="contenedor-verificacion">
        <label>
          <span className="etiqueta">Tipo de Emergencia</span>
          <select
            value={tipoEmergencia}
            onChange={(e) => setTipoEmergencia(e.target.value)}
            className="input-verificacion"
          >
            <option value="">Selecciona una opción</option>
            <option value="Médica">Médica</option>
            <option value="Seguridad">Seguridad</option>
            <option value="Técnica">Técnica</option>
            <option value="Clima">Clima</option>
            <option value="Incendios o Humo">Incendios o Humo</option>
          </select>
        </label>

        <label>
          <span className="etiqueta">Nivel de Severidad</span>
          <select
            value={severidad}
            onChange={(e) => setSeveridad(e.target.value)}
            className="input-verificacion"
          >
            <option value="">Selecciona un nivel</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
        </label>

        <label>
          <span className="etiqueta">Fecha del Incidente</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input-verificacion"
          />
        </label>

        <label>
          <span className="etiqueta">Hora del Incidente</span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="input-verificacion"
          />
        </label>

        <label>
          <span className="etiqueta">Ubicación Exacta</span>
          <input
            type="text"
            placeholder="Ej: Terminal B, Puerta 14"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="input-verificacion"
          />
        </label>

        <button onClick={manejarEnvio} className="boton-verificar">
          Registrar Emergencia
        </button>

        {mensajeConfirmacion && (
          <div className="resultado-ok">{mensajeConfirmacion}</div>
        )}
      </div>
    </div>
  );
};

export default ClasificacionRegistro;
