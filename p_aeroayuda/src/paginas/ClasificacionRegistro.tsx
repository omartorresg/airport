import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/clasificacion.css';

type EmergenciaRow = {
  id_emergencia: number;
  id_tipo: number;
  id_nivel: number;
  tipo_nombre: string;
  nivel_nombre: string;
  descripcion: string | null;
  fecha_hora: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  coordenada_x: number | null;
  coordenada_y: number | null;
};

type TipoEmergencia = { id_tipo_emergencia: number; nombre: string };
type Nivel = { id_nivel: number; nombre: string };

export default function ClasificacionEmergencias() {
  // Form
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ x: number; y: number } | null>(null);

  // Catálogos
  const [tiposEmergenciaDB, setTiposEmergenciaDB] = useState<TipoEmergencia[]>([]);
  const [nivelesDB, setNivelesDB] = useState<Nivel[]>([]);

  // Listado + filtros
  const [listado, setListado] = useState<EmergenciaRow[]>([]);
  const [filtro, setFiltro] = useState({ tipo: '', severidad: '', fecha: '', hora: '' });

  // Estado de UI
  const [mensaje, setMensaje] = useState('');
  const [seleccionId, setSeleccionId] = useState<number | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: tipos } = await supabase.from('tipos_emergencia').select('id_tipo_emergencia,nombre').order('nombre');
      const { data: niveles } = await supabase.from('niveles_severidad').select('id_nivel,nombre').order('nombre');
      setTiposEmergenciaDB((tipos || []) as TipoEmergencia[]);
      setNivelesDB((niveles || []) as Nivel[]);
      await cargarListado();
    };
    cargarDatos();
  }, []);

  const cargarListado = async () => {
    const { data, error } = await supabase
      .from('emergencias')
      .select(`
        id_emergencia, id_tipo, id_nivel, descripcion, fecha_hora, ubicacion, coordenada_x, coordenada_y,
        tipos_emergencia:tipos_emergencia (nombre, id_tipo_emergencia),
        niveles_severidad:niveles_severidad (nombre, id_nivel)
      `)
      .order('id_emergencia', { ascending: false });

    if (!error && data) {
      const rows: EmergenciaRow[] = (data as any[]).map((e) => ({
        id_emergencia: e.id_emergencia,
        id_tipo: e.id_tipo,
        id_nivel: e.id_nivel,
        tipo_nombre: e.tipos_emergencia?.nombre || '',
        nivel_nombre: e.niveles_severidad?.nombre || '',
        descripcion: e.descripcion || '',
        fecha_hora: e.fecha_hora,
        fecha: e.fecha_hora?.split('T')?.[0] || '',
        hora: e.fecha_hora?.split('T')?.[1]?.substring(0, 5) || '',
        ubicacion: e.ubicacion,
        coordenada_x: e.coordenada_x,
        coordenada_y: e.coordenada_y,
      }));
      setListado(rows);
    }
  };

  // Validaciones
  const validar = () => {
    if (!tipoEmergencia || !severidad || !fecha || !hora || !ubicacion || !descripcion.trim()) {
      return 'Completa tipo, severidad, fecha, hora, ubicación y descripción.';
    }
    if (!coordenadas) return 'Debes hacer clic en el mapa para marcar coordenadas.';
    return '';
  };

  // Mapa → coordenadas %
  const manejarClickMapa = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setCoordenadas({ x, y });
  };

  // Helpers
  const limpiar = () => {
    setTipoEmergencia('');
    setSeveridad('');
    setFecha('');
    setHora('');
    setUbicacion('');
    setDescripcion('');
    setCoordenadas(null);
    setSeleccionId(null);
    setMensaje('');
  };

  const getIdsSeleccionados = () => {
    const id_tipo = tiposEmergenciaDB.find((t) => t.nombre === tipoEmergencia)?.id_tipo_emergencia;
    const id_nivel = nivelesDB.find((n) => n.nombre === severidad)?.id_nivel;
    return { id_tipo, id_nivel };
  };

  // Registrar
  const registrar = async () => {
    setMensaje('');
    if (seleccionId !== null) {
      setMensaje('❌ Estás en modo edición. Usa “Modificar” o limpia el formulario.');
      return;
    }
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    const { id_tipo, id_nivel } = getIdsSeleccionados();
    if (!id_tipo || !id_nivel) {
      setMensaje('❌ Selección inválida de tipo o severidad.');
      return;
    }

    // Regla simple anti-duplicado: misma fecha_hora + ubicación + id_tipo + id_nivel
    const fecha_hora = `${fecha}T${hora}`;
    const { data: existe } = await supabase
      .from('emergencias')
      .select('id_emergencia')
      .eq('fecha_hora', fecha_hora)
      .eq('ubicacion', ubicacion)
      .eq('id_tipo', id_tipo)
      .eq('id_nivel', id_nivel)
      .maybeSingle();

    if (existe) { setMensaje('❌ Ya existe una emergencia con esos datos clave.'); return; }

    const { error } = await supabase.from('emergencias').insert({
      id_tipo,
      id_nivel,
      descripcion: descripcion.trim(),
      fecha_hora,
      ubicacion,
      coordenada_x: coordenadas!.x,
      coordenada_y: coordenadas!.y,
      activacion_manual: true
    });

    if (error) {
      setMensaje('❌ Error al registrar: ' + error.message);
      return;
    }

    setMensaje('✅ Emergencia registrada correctamente.');
    await cargarListado();
    limpiar();
  };

  // Seleccionar de la tabla
  const seleccionarFila = (row: EmergenciaRow) => {
    setSeleccionId(row.id_emergencia);
    setTipoEmergencia(row.tipo_nombre);
    setSeveridad(row.nivel_nombre);
    setFecha(row.fecha);
    setHora(row.hora);
    setUbicacion(row.ubicacion);
    setDescripcion(row.descripcion || '');
    if (row.coordenada_x !== null && row.coordenada_y !== null) {
      setCoordenadas({ x: row.coordenada_x, y: row.coordenada_y });
    } else {
      setCoordenadas(null);
    }
    setMensaje('ℹ️ Modo edición: puedes modificar o eliminar el registro.');
  };

  // Modificar
  const modificar = async () => {
    setMensaje('');
    if (seleccionId === null) { setMensaje('❌ No hay registro seleccionado para modificar.'); return; }
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    const { id_tipo, id_nivel } = getIdsSeleccionados();
    if (!id_tipo || !id_nivel) { setMensaje('❌ Selección inválida de tipo o severidad.'); return; }

    const fecha_hora = `${fecha}T${hora}`;

    // Evitar duplicar al editar (mismo criterio, exceptuando el propio ID)
    const { data: dup } = await supabase
      .from('emergencias')
      .select('id_emergencia')
      .eq('fecha_hora', fecha_hora)
      .eq('ubicacion', ubicacion)
      .eq('id_tipo', id_tipo)
      .eq('id_nivel', id_nivel)
      .neq('id_emergencia', seleccionId)
      .maybeSingle();
    if (dup) { setMensaje('❌ Ya existe otra emergencia con esos datos clave.'); return; }

    const { error } = await supabase
      .from('emergencias')
      .update({
        id_tipo,
        id_nivel,
        descripcion: descripcion.trim(),
        fecha_hora,
        ubicacion,
        coordenada_x: coordenadas!.x,
        coordenada_y: coordenadas!.y
      })
      .eq('id_emergencia', seleccionId);

    if (error) { setMensaje('❌ Error al modificar: ' + error.message); return; }

    setMensaje('✅ Cambios guardados correctamente.');
    await cargarListado();
    limpiar();
  };

  // Eliminar
  const eliminar = async () => {
    setMensaje('');
    if (seleccionId === null) { setMensaje('❌ No hay registro seleccionado para eliminar.'); return; }
    if (!window.confirm('¿Seguro que deseas eliminar esta emergencia?')) return;

    const { error } = await supabase.from('emergencias').delete().eq('id_emergencia', seleccionId);
    if (error) { setMensaje('❌ Error al eliminar: ' + error.message); return; }

    setMensaje('🗑️ Registro eliminado correctamente.');
    await cargarListado();
    limpiar();
  };

  // Filtros en memoria
  const listadoFiltrado = listado.filter((r) =>
    (!filtro.tipo || r.tipo_nombre === filtro.tipo) &&
    (!filtro.severidad || r.nivel_nombre === filtro.severidad) &&
    (!filtro.fecha || r.fecha === filtro.fecha) &&
    (!filtro.hora || r.hora === filtro.hora)
  );

  return (
    <>
      <div className="emg-title-wrap"><h1 className="emg-title">Registro / Clasificación de Emergencias</h1></div>

      <div className="emg-grid">
        {/* Panel Formulario */}
        <form className="emg-card emg-form" onSubmit={(e) => { e.preventDefault(); registrar(); }}>
          <h2 className="emg-subtitle">Datos de la Emergencia</h2>

          <label>
            <span className="emg-label">Tipo de Emergencia</span>
            <select className="emg-input" value={tipoEmergencia} onChange={(e) => setTipoEmergencia(e.target.value)}>
              <option value="">Seleccione</option>
              {tiposEmergenciaDB.map(t => (
                <option key={t.id_tipo_emergencia} value={t.nombre}>{t.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="emg-label">Nivel de Severidad</span>
            <select className="emg-input" value={severidad} onChange={(e) => setSeveridad(e.target.value)}>
              <option value="">Seleccione</option>
              {nivelesDB.map(n => (
                <option key={n.id_nivel} value={n.nombre}>{n.nombre}</option>
              ))}
            </select>
          </label>

          <label className="emg-col2">
            <span className="emg-label">Descripción</span>
            <textarea
              className="emg-input"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Incendio cerca de la pista principal"
            />
          </label>

          <label>
            <span className="emg-label">Fecha</span>
            <input type="date" className="emg-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>

          <label>
            <span className="emg-label">Hora</span>
            <input type="time" className="emg-input" value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>

          <label className="emg-col2">
            <span className="emg-label">Ubicación</span>
            <input type="text" className="emg-input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: Terminal B, Puerta 14" />
          </label>

          <div className="emg-col2">
            <span className="emg-label">Ubicación en mapa</span>
            <div className="emg-map-wrap">
              <img
                src="/mapa_aeropuerto.png"
                alt="Mapa del aeropuerto"
                className="emg-map"
                onClick={manejarClickMapa}
              />
            </div>
            {coordenadas && (
              <input
                className="emg-input"
                value={`X: ${coordenadas.x}%, Y: ${coordenadas.y}%`}
                readOnly
              />
            )}
          </div>

          <div className="emg-actions">
            <button type="button" className="emg-btn emg-btn-primary" onClick={registrar}>Registrar</button>
            <button type="button" className="emg-btn emg-btn-secondary" onClick={modificar}>Modificar</button>
            <button type="button" className="emg-btn emg-btn-danger" onClick={eliminar}>Eliminar</button>
            <button type="button" className="emg-btn emg-btn-ghost" onClick={limpiar}>Limpiar</button>
          </div>

          {mensaje && <div className="emg-msg">{mensaje}</div>}
        </form>

        {/* Panel Consulta */}
        <div className="emg-card emg-consulta">
          <h2 className="emg-subtitle">Consulta / Selección</h2>

          <div className="emg-filters">
            <select className="emg-input" value={filtro.tipo} onChange={(e)=>setFiltro(prev=>({...prev, tipo: e.target.value}))}>
              <option value="">Tipo</option>
              {tiposEmergenciaDB.map(t => <option key={t.id_tipo_emergencia} value={t.nombre}>{t.nombre}</option>)}
            </select>

            <select className="emg-input" value={filtro.severidad} onChange={(e)=>setFiltro(prev=>({...prev, severidad: e.target.value}))}>
              <option value="">Severidad</option>
              {nivelesDB.map(n => <option key={n.id_nivel} value={n.nombre}>{n.nombre}</option>)}
            </select>

            <input type="date" className="emg-input" value={filtro.fecha} onChange={(e)=>setFiltro(prev=>({...prev, fecha: e.target.value}))} />
            <input type="time" className="emg-input" value={filtro.hora} onChange={(e)=>setFiltro(prev=>({...prev, hora: e.target.value}))} />
          </div>

          <table className="emg-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {listadoFiltrado.map((r) => (
                <tr
                  key={r.id_emergencia}
                  className={r.id_emergencia === seleccionId ? 'emg-row-selected' : ''}
                  onClick={()=> seleccionarFila(r)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{r.id_emergencia}</td>
                  <td>{r.tipo_nombre}</td>
                  <td>{r.nivel_nombre}</td>
                  <td>{r.fecha}</td>
                  <td>{r.hora}</td>
                  <td>{r.ubicacion}</td>
                </tr>
              ))}
              {listadoFiltrado.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 12 }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
