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
  id_zona: number;
  nombre_zona: string;
  coordenada_x: number | null;
  coordenada_y: number | null;
};

type TipoEmergencia = { id_tipo_emergencia: number; nombre: string };
type Nivel = { id_nivel: number; nombre: string };
type Zona = { id_zona: number; nombre_zona: string };

export default function ClasificacionEmergencias() {
  // Form
  const [tipoEmergencia, setTipoEmergencia] = useState('');
  const [severidad, setSeveridad] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [idZona, setIdZona] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ x: number; y: number } | null>(null);

  // Catálogos
  const [tiposEmergenciaDB, setTiposEmergenciaDB] = useState<TipoEmergencia[]>([]);
  const [nivelesDB, setNivelesDB] = useState<Nivel[]>([]);
  const [zonasDB, setZonasDB] = useState<Zona[]>([]);

  // Listado + filtros
  const [listado, setListado] = useState<EmergenciaRow[]>([]);
  const [filtro, setFiltro] = useState({ tipo: '', severidad: '', fecha: '', hora: '', id_zona: '' });

  // UI
  const [mensaje, setMensaje] = useState('');
  const [seleccionId, setSeleccionId] = useState<number | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: tipos } = await supabase.from('tipos_emergencia').select('id_tipo_emergencia,nombre').order('nombre');
      const { data: niveles } = await supabase.from('niveles_severidad').select('id_nivel,nombre').order('nombre');
      const { data: zonas } = await supabase.from('zonas').select('id_zona,nombre_zona').order('nombre_zona');
      setTiposEmergenciaDB((tipos || []) as TipoEmergencia[]);
      setNivelesDB((niveles || []) as Nivel[]);
      setZonasDB((zonas || []) as Zona[]);
      await cargarListado();
    };
    cargarDatos();
  }, []);

  const cargarListado = async () => {
    const { data, error } = await supabase
      .from('emergencias')
      .select(`
        id_emergencia, id_tipo, id_nivel, descripcion, fecha_hora, id_zona, coordenada_x, coordenada_y, activacion_manual,
        tipos_emergencia:tipos_emergencia (nombre, id_tipo_emergencia),
        niveles_severidad:niveles_severidad (nombre, id_nivel),
        zonas:zonas (id_zona, nombre_zona)
      `)
      .order('id_emergencia', { ascending: false });

    if (error || !data) return;

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
      id_zona: e.id_zona,
      nombre_zona: e.zonas?.nombre_zona || '',
      coordenada_x: e.coordenada_x,
      coordenada_y: e.coordenada_y
    }));
    setListado(rows);
  };

  const getIdsSeleccionados = () => {
    const id_tipo = tiposEmergenciaDB.find((t) => t.nombre === tipoEmergencia)?.id_tipo_emergencia;
    const id_nivel = nivelesDB.find((n) => n.nombre === severidad)?.id_nivel;
    const zona_id = idZona ? parseInt(idZona) : undefined;
    return { id_tipo, id_nivel, zona_id };
  };

  const validar = () => {
    if (!tipoEmergencia || !severidad || !fecha || !hora || !idZona) return 'Completa tipo, severidad, fecha, hora y zona.';
    if (!descripcion.trim()) return 'La descripción es obligatoria.';
    if (!coordenadas) return 'Debes marcar coordenadas en el mapa.';
    return '';
  };

  const manejarClickMapa = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setCoordenadas({ x, y });
  };

  const limpiar = () => {
    setTipoEmergencia('');
    setSeveridad('');
    setFecha('');
    setHora('');
    setIdZona('');
    setDescripcion('');
    setCoordenadas(null);
    setSeleccionId(null);
    setMensaje('');
  };

  const registrar = async () => {
    setMensaje('');
    if (seleccionId !== null) { setMensaje('❌ Estás en modo edición. Usa “Modificar” o limpia.'); return; }
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    const { id_tipo, id_nivel, zona_id } = getIdsSeleccionados();
    if (!id_tipo || !id_nivel || !zona_id) { setMensaje('❌ Selección inválida de tipo, severidad o zona.'); return; }

    const fecha_hora = `${fecha}T${hora}`;
    const { error } = await supabase.from('emergencias').insert({
      id_tipo,
      id_nivel,
      id_zona: zona_id,
      descripcion: descripcion.trim(),
      fecha_hora,
      coordenada_x: coordenadas!.x,
      coordenada_y: coordenadas!.y,
      activacion_manual: true
    });
    if (error) { setMensaje('❌ Error al registrar: ' + error.message); return; }

    setMensaje('✅ Emergencia registrada correctamente.');
    await cargarListado();
    limpiar();
  };

  const seleccionarFila = (r: EmergenciaRow) => {
    setSeleccionId(r.id_emergencia);
    setTipoEmergencia(r.tipo_nombre);
    setSeveridad(r.nivel_nombre);
    setFecha(r.fecha);
    setHora(r.hora);
    setIdZona(String(r.id_zona));
    setDescripcion(r.descripcion || '');
    if (r.coordenada_x !== null && r.coordenada_y !== null) setCoordenadas({ x: r.coordenada_x, y: r.coordenada_y });
    else setCoordenadas(null);
    setMensaje('ℹ️ Modo edición: puedes modificar o eliminar el registro.');
  };

  const modificar = async () => {
    setMensaje('');
    if (seleccionId === null) { setMensaje('❌ No hay registro seleccionado para modificar.'); return; }
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    const { id_tipo, id_nivel, zona_id } = getIdsSeleccionados();
    if (!id_tipo || !id_nivel || !zona_id) { setMensaje('❌ Selección inválida de tipo, severidad o zona.'); return; }

    const fecha_hora = `${fecha}T${hora}`;
    const { error } = await supabase
      .from('emergencias')
      .update({
        id_tipo,
        id_nivel,
        id_zona: zona_id,
        descripcion: descripcion.trim(),
        fecha_hora,
        coordenada_x: coordenadas!.x,
        coordenada_y: coordenadas!.y
      })
      .eq('id_emergencia', seleccionId);

    if (error) { setMensaje('❌ Error al modificar: ' + error.message); return; }

    setMensaje('✅ Cambios guardados correctamente.');
    await cargarListado();
    limpiar();
  };

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

  const listadoFiltrado = listado.filter((r) =>
    (!filtro.tipo || r.tipo_nombre === filtro.tipo) &&
    (!filtro.severidad || r.nivel_nombre === filtro.severidad) &&
    (!filtro.fecha || r.fecha === filtro.fecha) &&
    (!filtro.hora || r.hora === filtro.hora) &&
    (!filtro.id_zona || String(r.id_zona) === filtro.id_zona)
  );

  return (
    <>
      <div className="emg-title-wrap"><h1 className="emg-title">Registro / Clasificación de Emergencias</h1></div>

      <div className="emg-grid">
        {/* Formulario */}
        <form className="emg-card emg-form" onSubmit={(e) => { e.preventDefault(); registrar(); }}>
          <h2 className="emg-subtitle">Datos de la Emergencia</h2>

          <label>
            <span className="emg-label">Tipo de Emergencia</span>
            <select className="emg-input" value={tipoEmergencia} onChange={(e) => setTipoEmergencia(e.target.value)}>
              <option value="">Seleccione</option>
              {tiposEmergenciaDB.map(t => <option key={t.id_tipo_emergencia} value={t.nombre}>{t.nombre}</option>)}
            </select>
          </label>

          <label>
            <span className="emg-label">Nivel de Severidad</span>
            <select className="emg-input" value={severidad} onChange={(e) => setSeveridad(e.target.value)}>
              <option value="">Seleccione</option>
              {nivelesDB.map(n => <option key={n.id_nivel} value={n.nombre}>{n.nombre}</option>)}
            </select>
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
            <span className="emg-label">Zona</span>
            <select className="emg-input" value={idZona} onChange={(e)=>setIdZona(e.target.value)}>
              <option value="">Seleccione una zona</option>
              {zonasDB.map(z => <option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>)}
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
              <input className="emg-input" value={`X: ${coordenadas.x}%, Y: ${coordenadas.y}%`} readOnly />
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

        {/* Consulta */}
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

            <select className="emg-input" value={filtro.id_zona} onChange={(e)=>setFiltro(prev=>({...prev, id_zona: e.target.value}))}>
              <option value="">Zona</option>
              {zonasDB.map(z => <option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>)}
            </select>

            <input type="date" className="emg-input" value={filtro.fecha} onChange={(e)=>setFiltro(prev=>({...prev, fecha: e.target.value}))} />
            <input type="time" className="emg-input" value={filtro.hora} onChange={(e)=>setFiltro(prev=>({...prev, hora: e.target.value}))} />
          </div>

          <div style={{overflowX:'auto', border:'1px solid #e5e7eb', borderRadius:8}}>
            <table className="emg-table" style={{minWidth: 900}}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Zona</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Coordenadas</th>
                  <th>Descripción</th>
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
                    <td>{r.nombre_zona}</td>
                    <td>{r.fecha}</td>
                    <td>{r.hora}</td>
                    <td>{(r.coordenada_x!==null && r.coordenada_y!==null) ? `${r.coordenada_x}%, ${r.coordenada_y}%` : ''}</td>
                    <td>{r.descripcion}</td>
                  </tr>
                ))}
                {listadoFiltrado.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 12 }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
