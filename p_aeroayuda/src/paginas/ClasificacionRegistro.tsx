import React, { useEffect, useState } from 'react';
import '../styles/clasificacion.css';
import { supabase } from '../SupabaseClient';

const ClasificacionRegistro = () => {
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [tiposEmergenciaDB, setTiposEmergenciaDB] = useState<any[]>([]);
  const [nivelesDB, setNivelesDB] = useState<any[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: tipos } = await supabase.from('tipos_emergencia').select();
      const { data: niveles } = await supabase.from('niveles_severidad').select();
      setTiposEmergenciaDB(tipos || []);
      setNivelesDB(niveles || []);
    };
    cargarDatos();
  }, []);

  const manejarEnvio = async () => {
    if (tipoEmergencia && severidad && fecha && hora && ubicacion) {
      const id_tipo = tiposEmergenciaDB.find((t) => t.nombre === tipoEmergencia)?.id_tipo_emergencia;
      const id_nivel = nivelesDB.find((n) => n.nombre.toLowerCase() === severidad.toLowerCase())?.id_nivel;

      if (!id_tipo || !id_nivel) {
        alert('Error en la selección de tipo o nivel.');
        return;
      }

      const fecha_hora = `${fecha}T${hora}`;
      const { error } = await supabase.from('emergencias').insert({
        id_tipo,
        id_nivel,
        fecha_hora,
        ubicacion
      });

      if (!error) {
        setMensajeConfirmacion('✅ Emergencia registrada correctamente.');
        setTipoEmergencia('');
        setSeveridad('');
        setFecha('');
        setHora('');
        setUbicacion('');
      } else {
        alert('Error al registrar la emergencia.');
      }
    } else {
      alert('Por favor, completa todos los campos.');
    }
  };

  return (
    <>
      <div className="titulo-clasificacion">
        <h1>Registro y Clasificación de Emergencias</h1>
      </div>
      <div className="contenedor">
        <div className="contenedor-clasificacion">
          <h2 className="subtitulo">Registro de Emergencias</h2>

          <label>
            <span className="etiqueta">Tipo de Emergencia</span>
            <select value={tipoEmergencia} onChange={(e) => setTipoEmergencia(e.target.value)} className="input-clasificacion">
              <option value="">Selecciona una opción</option>
              {tiposEmergenciaDB.map((tipo) => (
                <option key={tipo.id_tipo_emergencia} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="etiqueta">Nivel de Severidad</span>
            <select value={severidad} onChange={(e) => setSeveridad(e.target.value)} className="input-clasificacion">
              <option value="">Selecciona un nivel</option>
              {nivelesDB.map((nivel) => (
                <option key={nivel.id_nivel} value={nivel.nombre}>{nivel.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="etiqueta">Fecha del Incidente</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-clasificacion" />
          </label>

          <label>
            <span className="etiqueta">Hora del Incidente</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input-clasificacion" />
          </label>

          <label className="campo-completo">
            <span className="etiqueta">Ubicación Exacta</span>
            <input type="text" placeholder="Ej: Terminal B, Puerta 14" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="input-clasificacion" />
          </label>

          <button onClick={manejarEnvio} className="boton-verificar">Registrar</button>

          {mensajeConfirmacion && (
            <div className="resultado-ok" style={{ gridColumn: '1 / -1' }}>
              {mensajeConfirmacion}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClasificacionRegistro;
