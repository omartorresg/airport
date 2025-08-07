import React, { useEffect, useState } from 'react';
import '../styles/clasificacion.css';
import { supabase } from '../SupabaseClient';

const ClasificacionRegistro = () => {
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ x: number; y: number } | null>(null);
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

  const manejarClickMapa = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setCoordenadas({ x, y });
  };

  const manejarEnvio = async () => {
    if (tipoEmergencia && severidad && fecha && hora && ubicacion && descripcion && coordenadas) {
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
        descripcion,
        fecha_hora,
        ubicacion,
        coordenada_x: coordenadas.x,
        coordenada_y: coordenadas.y,
      });

      if (!error) {
        setMensajeConfirmacion('✅ Emergencia registrada correctamente.');
        setTipoEmergencia('');
        setSeveridad('');
        setFecha('');
        setHora('');
        setUbicacion('');
        setDescripcion('');
        setCoordenadas(null);
      } else {
        alert('Error al registrar la emergencia.');
      }
    } else {
      alert('Por favor, completa todos los campos y selecciona una ubicación en el mapa.');
    }
  };

  return (
    <>
      <div className="titulo-clasificacion">
        <h1>Registro y Clasificación de Emergencias</h1>
      </div>
      <div className="contenedor-clasi">
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
            <span className="etiqueta">Descripción de la Emergencia</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="input-clasificacion"
              rows={3}
              placeholder="Ej: Incendio reportado cerca de la pista de aterrizaje"
            />
          </label>

          <label>
            <span className="etiqueta">Fecha del Incidente</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-clasificacion" />
          </label>

          <label>
            <span className="etiqueta">Hora del Incidente</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input-clasificacion" />
          </label>

          <label>
            <span className="etiqueta">Ubicación Exacta</span>
            <input
              type="text"
              placeholder="Ej: Terminal B, Puerta 14"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="input-clasificacion"
            />
          </label>

          <div className="panel-mapa">
            <span className="etiqueta">Ubicación en Mapa</span>
            <img
              src="/mapa_aeropuerto.png"
              alt="Mapa del aeropuerto"
              className="imagen-mapa"
              onClick={manejarClickMapa}
            />
            {coordenadas && (
              <input
                type="text"
                className="input-clasificacion"
                value={`X: ${coordenadas.x}%, Y: ${coordenadas.y}%`}
                readOnly
              />
            )}
          </div>

          <button onClick={manejarEnvio} className="boton-verificar">Registrar</button>

          {mensajeConfirmacion && (
            <div className="resultado-ok">
              {mensajeConfirmacion}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClasificacionRegistro;
