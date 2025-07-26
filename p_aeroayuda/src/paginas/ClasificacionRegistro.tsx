import React, { useState } from 'react';
import '../styles/clasificacion.css';

interface Registro {
  tipo: string;
  severidad: string;
  fecha: string;
  hora: string;
  ubicacion: string;
}

const ClasificacionRegistro = () => {
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [filtro, setFiltro] = useState({ tipo: '', severidad: '', fecha: '', hora: '' });

  const manejarEnvio = () => {
    if (tipoEmergencia && severidad && fecha && hora && ubicacion) {
      const nuevoRegistro: Registro = { tipo: tipoEmergencia, severidad, fecha, hora, ubicacion };
      setRegistros([...registros, nuevoRegistro]);
      setMensajeConfirmacion('✅ Emergencia registrada correctamente.');
    } else {
      alert('Por favor, completa todos los campos.');
    }
  };

  const registrosFiltrados = registros.filter((reg) =>
    (!filtro.tipo || reg.tipo === filtro.tipo) &&
    (!filtro.severidad || reg.severidad === filtro.severidad) &&
    (!filtro.fecha || reg.fecha === filtro.fecha) &&
    (!filtro.hora || reg.hora === filtro.hora)
  );

  return (
   <>
    <div className="titulo-verificacion">
      <h1>Registro y Clasificación de Emergencias</h1>
    </div>
 <div className="contenedor">
 

      {/* Formulario */}
      <div className="contenedor-verificacion">
  <h2 className="subtitulo">Registro de Emergencias</h2>

  <label>
    <span className="etiqueta">Tipo de Emergencia</span>
    <select value={tipoEmergencia} onChange={(e) => setTipoEmergencia(e.target.value)} className="input-verificacion">
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
    <select value={severidad} onChange={(e) => setSeveridad(e.target.value)} className="input-verificacion">
      <option value="">Selecciona un nivel</option>
      <option value="Baja">Baja</option>
      <option value="Media">Media</option>
      <option value="Alta">Alta</option>
      <option value="Crítica">Crítica</option>
    </select>
  </label>

  <label>
    <span className="etiqueta">Fecha del Incidente</span>
    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-verificacion" />
  </label>

  <label>
    <span className="etiqueta">Hora del Incidente</span>
    <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input-verificacion" />
  </label>

  <label className="campo-completo">
    <span className="etiqueta">Ubicación Exacta</span>
    <input type="text" placeholder="Ej: Terminal B, Puerta 14" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="input-verificacion" />
  </label>

  <button onClick={manejarEnvio} className="boton-verificar">Registrar</button>

  {mensajeConfirmacion && (
    <div className="resultado-ok" style={{ gridColumn: '1 / -1' }}>
      {mensajeConfirmacion}
    </div>
  )}
</div>

      {/* Consulta */}
      <div className="consulta-container">
  <h2>Consulta de Registros</h2>

  <div className="filter-row">
    <select>
      <option value="">Tipo</option>
      <option value="Tipo 1">Tipo 1</option>
      <option value="Tipo 2">Tipo 2</option>
    </select>

    <select>
      <option value="">Severidad</option>
      <option value="Alta">Alta</option>
      <option value="Media">Media</option>
      <option value="Baja">Baja</option>
    </select>

    <input type="date" placeholder="Fecha" />
    <input type="time" placeholder="Hora" />

    <button className="buscar-btn">Buscar</button>
  </div>

  <table className="result-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Tipo</th>
        <th>Severidad</th>
        <th>Fecha</th>
        <th>Hora</th>
        <th>Descripción</th>
      </tr>
    </thead>
    <tbody>
  {[...Array(7)].map((_, index) => (
    <tr key={index}>
      <td>{index + 1}</td>
      <td colSpan={5} style={{ color: '#aaa', fontStyle: 'italic' }}>Sin datos</td>
    </tr>
  ))}
</tbody>

  </table>
</div>

    </div>
    </>
  );
};

export default ClasificacionRegistro;
