import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/protocolo.css';

interface Emergencia {
  id_emergencia: number;
  tipo: string;
  severidad: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  descripcion?: string;
}

const Protocolo = () => {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [emergenciaSeleccionada, setEmergenciaSeleccionada] = useState<number | null>(null);
  const [alertaEnviada, setAlertaEnviada] = useState(false);
  const [unidadesDesplegadas, setUnidadesDesplegadas] = useState(false);
  const [filtro, setFiltro] = useState({ tipo: '', severidad: '', fecha: '', hora: '' });

  const [tiposEmergenciaDB, setTiposEmergenciaDB] = useState<any[]>([]);
  const [nivelesDB, setNivelesDB] = useState<any[]>([]);

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
      setEmergencias(datos);
    }
  };

  const activarProtocolo = () => {
    if (emergenciaSeleccionada) {
      setAlertaEnviada(true);
      setUnidadesDesplegadas(true);
    } else {
      alert("Selecciona una emergencia para activar el protocolo.");
    }
  };

  const filtrados = emergencias.filter((reg) =>
    (!filtro.tipo || reg.tipo === filtro.tipo) &&
    (!filtro.severidad || reg.severidad === filtro.severidad) &&
    (!filtro.fecha || reg.fecha === filtro.fecha) &&
    (!filtro.hora || reg.hora === filtro.hora)
  );

  return (
    <>
      <div className="titulo-protocolo">
        <h1>Activación de Protocolo de Emergencia</h1>
      </div>

      <div className="contenedor">
        {/* Consulta Emergencias */}
        <div className="consulta-container">
          <h2>Emergencias Registradas</h2>
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
            
          </div>

          <table className="result-table">
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th>ID</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((reg) => (
                <tr key={reg.id_emergencia}>
                  <td>
                    <input
                      type="radio"
                      name="emergencia"
                      value={reg.id_emergencia}
                      onChange={() => setEmergenciaSeleccionada(reg.id_emergencia)}
                      checked={emergenciaSeleccionada === reg.id_emergencia}
                    />
                  </td>
                  <td>{reg.id_emergencia}</td>
                  <td>{reg.tipo}</td>
                  <td>{reg.severidad}</td>
                  <td>{reg.fecha}</td>
                  <td>{reg.hora}</td>
                  <td>{reg.ubicacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activación Protocolo */}
        <div className="contenedor-protocolo">
          <h2 className="subtitulo">Activar Protocolo</h2>
          <p>Selecciona una emergencia de la lista para activar el protocolo correspondiente.</p>

          <button onClick={activarProtocolo} className="boton-verificar">
            Activar Protocolo
          </button>

          {alertaEnviada && (
            <div className="resultado-ok" style={{ gridColumn: '1 / -1' }}>
              ✅ Alerta enviada al equipo de respuesta.
            </div>
          )}
          {unidadesDesplegadas && (
            <div className="resultado-ok" style={{ gridColumn: '1 / -1' }}>
              ✅ Unidades desplegadas: ambulancia, bomberos, seguridad.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Protocolo;
