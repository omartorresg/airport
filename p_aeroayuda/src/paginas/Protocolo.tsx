import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/protocolo.css';

type EmergenciaLite = {
  id_emergencia: number;
  tipo_nombre: string;
  nivel_nombre: string;
  nombre_zona: string;
  fecha: string;
  hora: string;
  activacion_manual: boolean | null;
};

type TipoEmergencia = { id_tipo_emergencia: number; nombre: string };
type Nivel = { id_nivel: number; nombre: string };
type Zona = { id_zona: number; nombre_zona: string };

export default function ActivacionProtocolo() {
  const [tipos, setTipos] = useState<TipoEmergencia[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);

  const [listado, setListado] = useState<EmergenciaLite[]>([]);
  const [filtro, setFiltro] = useState({ tipo: '', severidad: '', id_zona: '', fecha: '' });

  const [seleccionId, setSeleccionId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data: t } = await supabase.from('tipos_emergencia').select('id_tipo_emergencia,nombre').order('nombre');
      const { data: n } = await supabase.from('niveles_severidad').select('id_nivel,nombre').order('nombre');
      const { data: z } = await supabase.from('zonas').select('id_zona,nombre_zona').order('nombre_zona');
      setTipos((t || []) as TipoEmergencia[]);
      setNiveles((n || []) as Nivel[]);
      setZonas((z || []) as Zona[]);
      await cargarEmergencias();
    };
    cargar();
  }, []);

  const cargarEmergencias = async () => {
    const { data, error } = await supabase
      .from('emergencias')
      .select(`
        id_emergencia, fecha_hora, activacion_manual,
        tipos_emergencia:tipos_emergencia (nombre),
        niveles_severidad:niveles_severidad (nombre),
        zonas:zonas (nombre_zona)
      `)
      .order('id_emergencia', { ascending: false });

    if (error || !data) return;

    const rows: EmergenciaLite[] = (data as any[]).map(e => ({
      id_emergencia: e.id_emergencia,
      tipo_nombre: e.tipos_emergencia?.nombre || '',
      nivel_nombre: e.niveles_severidad?.nombre || '',
      nombre_zona: e.zonas?.nombre_zona || '',
      fecha: e.fecha_hora?.split('T')?.[0] || '',
      hora: e.fecha_hora?.split('T')?.[1]?.substring(0,5) || '',
      activacion_manual: e.activacion_manual
    }));
    setListado(rows);
  };

  const activar = async () => {
    setMensaje('');
    if (seleccionId === null) { setMensaje('❌ Selecciona una emergencia.'); return; }
    const { error } = await supabase
      .from('emergencias')
      .update({ activacion_manual: true })
      .eq('id_emergencia', seleccionId);
    if (error) { setMensaje('❌ Error al activar: ' + error.message); return; }
    setMensaje('✅ Protocolo activado.');
    await cargarEmergencias();
  };

  const desactivar = async () => {
    setMensaje('');
    if (seleccionId === null) { setMensaje('❌ Selecciona una emergencia.'); return; }
    const { error } = await supabase
      .from('emergencias')
      .update({ activacion_manual: false })
      .eq('id_emergencia', seleccionId);
    if (error) { setMensaje('❌ Error al desactivar: ' + error.message); return; }
    setMensaje('✅ Protocolo desactivado.');
    await cargarEmergencias();
  };

  const listadoFiltrado = listado.filter(r =>
    (!filtro.tipo || r.tipo_nombre === filtro.tipo) &&
    (!filtro.severidad || r.nivel_nombre === filtro.severidad) &&
    (!filtro.id_zona || r.nombre_zona === (zonas.find(z=>String(z.id_zona)===filtro.id_zona)?.nombre_zona || '')) &&
    (!filtro.fecha || r.fecha === filtro.fecha)
  );

  const seleccionado = listado.find(l => l.id_emergencia === seleccionId);

  return (
    <>
      <div className="ap-title-wrap"><h1 className="ap-title">Activación de Protocolo</h1></div>

      <div className="ap-grid">
        {/* Listado + filtros */}
        <div className="ap-card ap-list">
          <h2 className="ap-subtitle">Emergencias</h2>

          <div className="ap-filters">
            <select className="ap-input" value={filtro.tipo} onChange={(e)=>setFiltro(prev=>({...prev, tipo:e.target.value}))}>
              <option value="">Tipo</option>
              {tipos.map(t=><option key={t.id_tipo_emergencia} value={t.nombre}>{t.nombre}</option>)}
            </select>

            <select className="ap-input" value={filtro.severidad} onChange={(e)=>setFiltro(prev=>({...prev, severidad:e.target.value}))}>
              <option value="">Severidad</option>
              {niveles.map(n=><option key={n.id_nivel} value={n.nombre}>{n.nombre}</option>)}
            </select>

            <select className="ap-input" value={filtro.id_zona} onChange={(e)=>setFiltro(prev=>({...prev, id_zona:e.target.value}))}>
              <option value="">Zona</option>
              {zonas.map(z=><option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>)}
            </select>

            <input className="ap-input" type="date" value={filtro.fecha} onChange={(e)=>setFiltro(prev=>({...prev, fecha:e.target.value}))} />
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Zona</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Protocolo</th>
                </tr>
              </thead>
              <tbody>
                {listadoFiltrado.map(r=>(
                  <tr key={r.id_emergencia}
                      onClick={()=>setSeleccionId(r.id_emergencia)}
                      className={seleccionId===r.id_emergencia ? 'ap-row-selected' : ''}
                      style={{cursor:'pointer'}}>
                    <td>{r.id_emergencia}</td>
                    <td>{r.tipo_nombre}</td>
                    <td>{r.nivel_nombre}</td>
                    <td>{r.nombre_zona}</td>
                    <td>{r.fecha}</td>
                    <td>{r.hora}</td>
                    <td>{r.activacion_manual ? 'ACTIVO' : 'INACTIVO'}</td>
                  </tr>
                ))}
                {listadoFiltrado.length===0 && (
                  <tr><td colSpan={7} style={{textAlign:'center', padding:12}}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones */}
        <div className="ap-card ap-actions-card">
          <h2 className="ap-subtitle">Acciones</h2>

          {!seleccionado && <div className="ap-msg ap-msg-info">Selecciona una emergencia del listado.</div>}

          {seleccionado && (
            <>
              <div className="ap-detail">
                <div><strong>Emergencia #{seleccionado.id_emergencia}</strong></div>
                <div><strong>Tipo:</strong> {seleccionado.tipo_nombre}</div>
                <div><strong>Severidad:</strong> {seleccionado.nivel_nombre}</div>
                <div><strong>Zona:</strong> {seleccionado.nombre_zona}</div>
                <div><strong>Fecha/Hora:</strong> {seleccionado.fecha} {seleccionado.hora}</div>
                <div><strong>Estado protocolo:</strong> {seleccionado.activacion_manual ? 'ACTIVO' : 'INACTIVO'}</div>
              </div>

              <div className="ap-actions">
                <button type="button" className="ap-btn ap-btn-primary" onClick={activar}>Activar protocolo</button>
                <button type="button" className="ap-btn ap-btn-danger" onClick={desactivar}>Desactivar</button>
              </div>
            </>
          )}

          {mensaje && <div className="ap-msg">{mensaje}</div>}
        </div>
      </div>
    </>
  );
}
