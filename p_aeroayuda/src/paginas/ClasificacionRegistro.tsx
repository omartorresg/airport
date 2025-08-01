import React, { useEffect, useState } from 'react';
import '../styles/clasificacion.css';
import { supabase } from '../SupabaseClient';

interface Registro {
  id_emergencia: number;
  tipo: string;
  severidad: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  descripcion?: string;
}

const ClasificacionRegistro = () => {
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [tiposEmergenciaDB, setTiposEmergenciaDB] = useState<any[]>([]);
  const [nivelesDB, setNivelesDB] = useState<any[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [filtro, setFiltro] = useState({ tipo: '', severidad: '', fecha: '', hora: '' });

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: tipos } = await supabase.from('tipos_emergencia').select();
      const { data: niveles } = await supabase.from('niveles_severidad').select();
      setTiposEmergenciaDB(tipos || []);
      setNivelesDB(niveles || []);
      await cargarEmergencias();
    };
    cargarDatos();
  }, []);

  const cargarEmergencias = async () => {
    const { data, error } = await supabase
      .from('emergencias')
      .select(`
        id_emergencia, descripcion, fecha_hora, ubicacion,
        tipos_emergencia(nombre),
        niveles_severidad(nombre)
      `)
      .order('id_emergencia', { ascending: false });

    if (!error && data) {
      const datos = data.map((e: any) => ({
        id_emergencia: e.id_emergencia,
        tipo: e.tipos_emergencia?.nombre || '',
        severidad: e.niveles_severidad?.nombre || '',
        fecha: e.fecha_hora.split('T')[0],
        hora: e.fecha_hora.split('T')[1].substring(0, 5),
        ubicacion: e.ubicacion,
        descripcion: e.descripcion || ''
      }));
      setRegistros(datos);
    }
  };

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
        await cargarEmergencias();
      } else {
        alert('Error al registrar la emergencia.');
      }
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
              {tiposEmergenciaDB.map((tipo) => (
                <option key={tipo.id_tipo_emergencia} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="etiqueta">Nivel de Severidad</span>
            <select value={severidad} onChange={(e) => setSeveridad(e.target.value)} className="input-verificacion">
              <option value="">Selecciona un nivel</option>
              {nivelesDB.map((nivel) => (
                <option key={nivel.id_nivel} value={nivel.nombre}>{nivel.nombre}</option>
              ))}
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
            <select onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}>
              <option value="">Tipo</option>
              {tiposEmergenciaDB.map((tipo) => (
                <option key={tipo.id_tipo_emergencia} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>

            <select onChange={(e) => setFiltro({ ...filtro, severidad: e.target.value })}>
              <option value="">Severidad</option>
              {nivelesDB.map((nivel) => (
                <option key={nivel.id_nivel} value={nivel.nombre}>{nivel.nombre}</option>
              ))}
            </select>

            <input type="date" onChange={(e) => setFiltro({ ...filtro, fecha: e.target.value })} />
            <input type="time" onChange={(e) => setFiltro({ ...filtro, hora: e.target.value })} />

            <button className="buscar-btn" onClick={cargarEmergencias}>Buscar</button>
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
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length === 0 ? (
                [...Array(4)].map((_, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td colSpan={6} style={{ color: '#aaa', fontStyle: 'italic' }}>Sin datos</td>
                  </tr>
                ))
              ) : (
                registrosFiltrados.map((reg) => (
                  <tr key={reg.id_emergencia}>
                    <td>{reg.id_emergencia}</td>
                    <td>{reg.tipo}</td>
                    <td>{reg.severidad}</td>
                    <td>{reg.fecha}</td>
                    <td>{reg.hora}</td>
                    <td>{reg.descripcion || '-'}</td>
                    <td>{reg.ubicacion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ClasificacionRegistro;
