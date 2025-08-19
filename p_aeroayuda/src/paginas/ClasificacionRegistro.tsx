import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/clasificacion.css'; // Importa los estilos del otro componente

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
  afectado_tipo?: 'general' | 'pasajero' | 'empleado';
  id_pasajero?: number | null;
  id_personal?: number | null;
};

type Pasajero = {
  id_persona: number;
  nombre: string;
  documento?: string | null;
};
type Empleado = {
  id_personal: number;
  nombre: string;
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

  const [afectadoTipo, setAfectadoTipo] = useState<'general' | 'pasajero' | 'empleado'>('general');
  const [idPasajero, setIdPasajero] = useState('');
  const [idPersonal, setIdPersonal] = useState('');

  const [pasajerosDB, setPasajerosDB] = useState<Pasajero[]>([]);
  const [empleadosDB, setEmpleadosDB] = useState<Empleado[]>([]);

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

      const { data: empleados } = await supabase
        .from('personal_operativo')
        .select('id_personal,nombre')
        .order('nombre');
      setEmpleadosDB((empleados || []) as Empleado[]);

      const { data: pax } = await supabase
        .from('pasajero')
        .select('id_persona, persona:persona (nombre, apellido, numero_documento)')
        .order('id_persona', { ascending: false });

      const pas = (pax || []).map((p: any) => ({
        id_persona: p.id_persona,
        nombre: [p.persona?.nombre, p.persona?.apellido].filter(Boolean).join(' ') || `ID ${p.id_persona}`,
        documento: p.persona?.numero_documento || null
      })) as Pasajero[];

      setPasajerosDB(pas);

      await cargarListado();
    };
    cargarDatos();
  }, []);

  const cargarListado = async () => {
    const { data, error } = await supabase
      .from('emergencias')
      .select(`
        id_emergencia, id_tipo, id_nivel, descripcion, fecha_hora, id_zona, coordenada_x, coordenada_y, activacion_manual,
        afectado_tipo, id_pasajero, id_personal,
        tipos_emergencia:tipos_emergencia (nombre, id_tipo_emergencia),
        niveles_severidad:niveles_severidad (nombre, id_nivel),
        zonas:zonas (id_zona, nombre_zona),
        pasajero:pasajero!left(id_persona, persona:persona(nombre, apellido)),
        personal_operativo:personal_operativo!left(id_personal, nombre)
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
      coordenada_y: e.coordenada_y,
      afectado_tipo: e.afectado_tipo,
      id_pasajero: e.id_pasajero,
      id_personal: e.id_personal
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
    if (afectadoTipo === 'pasajero' && !idPasajero) return 'Selecciona el pasajero afectado.';
    if (afectadoTipo === 'empleado' && !idPersonal) return 'Selecciona el empleado afectado.';
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
    setAfectadoTipo('general');
    setIdPasajero('');
    setIdPersonal('');
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

    const payload: any = {
      id_tipo,
      id_nivel,
      id_zona: zona_id,
      descripcion: descripcion.trim(),
      fecha_hora,
      coordenada_x: coordenadas!.x,
      coordenada_y: coordenadas!.y,
      activacion_manual: true,
      afectado_tipo: afectadoTipo,
      id_pasajero: null,
      id_personal: null
    };

    if (afectadoTipo === 'pasajero') payload.id_pasajero = Number(idPasajero);
    if (afectadoTipo === 'empleado') payload.id_personal = Number(idPersonal);

    const { error } = await supabase.from('emergencias').insert(payload);

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
    setAfectadoTipo(r.afectado_tipo || 'general');
    setIdPasajero(r.id_pasajero ? String(r.id_pasajero) : '');
    setIdPersonal(r.id_personal ? String(r.id_personal) : '');
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
    const payload: any = {
      id_tipo,
      id_nivel,
      id_zona: zona_id,
      descripcion: descripcion.trim(),
      fecha_hora,
      coordenada_x: coordenadas!.x,
      coordenada_y: coordenadas!.y,
      afectado_tipo: afectadoTipo,
      id_pasajero: null,
      id_personal: null
    };

    if (afectadoTipo === 'pasajero') payload.id_pasajero = Number(idPasajero);
    if (afectadoTipo === 'empleado') payload.id_personal = Number(idPersonal);

    const { error } = await supabase
      .from('emergencias')
      .update(payload)
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
      <div className="titulo-personal"><h1 className="emg-title">Registro / Clasificación de Emergencias</h1></div>

      <div className="contenedor-perso">
        {/* Formulario */}
        <form className="contenedor-personal registrar-personal" onSubmit={(e) => { e.preventDefault(); registrar(); }}>
          <h2 className="subtitulo">Datos de la Emergencia</h2>

          <label>
            <span className="etiqueta">Tipo de Emergencia</span>
            <select className="input-personal" value={tipoEmergencia} onChange={(e) => setTipoEmergencia(e.target.value)}>
              <option value="">Seleccione</option>
              {tiposEmergenciaDB.map(t => <option key={t.id_tipo_emergencia} value={t.nombre}>{t.nombre}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Nivel de Severidad</span>
            <select className="input-personal" value={severidad} onChange={(e) => setSeveridad(e.target.value)}>
              <option value="">Seleccione</option>
              {nivelesDB.map(n => <option key={n.id_nivel} value={n.nombre}>{n.nombre}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Fecha</span>
            <input type="date" className="input-personal" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>

          <label>
            <span className="etiqueta">Hora</span>
            <input type="time" className="input-personal" value={hora} onChange={(e) => setHora(e.target.value)} />
          </label>

          <label>
            <span className="etiqueta">Zona</span>
            <select className="input-personal" value={idZona} onChange={(e) => setIdZona(e.target.value)}>
              <option value="">Seleccione una zona</option>
              {zonasDB.map(z => <option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Descripción</span>
            <textarea
              className="input-personal"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Incendio cerca de la pista principal"
            />
          </label>

          <div className="panel panel-contacto">
            <h3>Afectado</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <label className="chk">
                <input type="radio" name="afectado" checked={afectadoTipo === 'general'} onChange={() => { setAfectadoTipo('general'); setIdPasajero(''); setIdPersonal(''); }} />
                General
              </label>
              <label className="chk">
                <input type="radio" name="afectado" checked={afectadoTipo === 'pasajero'} onChange={() => { setAfectadoTipo('pasajero'); setIdPersonal(''); }} />
                Pasajero
              </label>
              <label className="chk">
                <input type="radio" name="afectado" checked={afectadoTipo === 'empleado'} onChange={() => { setAfectadoTipo('empleado'); setIdPasajero(''); }} />
                Empleado
              </label>
            </div>
            {afectadoTipo === 'pasajero' && (
              <label>
                <select className="input-personal" value={idPasajero} onChange={e => setIdPasajero(e.target.value)}>
                  <option value="">Seleccione pasajero</option>
                  {pasajerosDB.map(p => (
                    <option key={p.id_persona} value={p.id_persona}>
                      {p.nombre}{p.documento ? ` · ${p.documento}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {afectadoTipo === 'empleado' && (
              <label>
                <select className="input-personal" value={idPersonal} onChange={e => setIdPersonal(e.target.value)}>
                  <option value="">Seleccione empleado</option>
                  {empleadosDB.map(emp => (
                    <option key={emp.id_personal} value={emp.id_personal}>{emp.nombre}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="panel panel-contacto">
            <h3>Ubicación</h3>
            <div className="emg-map-wrap">
              <img
                src="/mapa_aeropuerto.png"
                alt="Mapa del aeropuerto"
                className="emg-map"
                onClick={manejarClickMapa}
              />
              {coordenadas && (
                <div
                  className="emg-pin"
                  style={{ left: `${coordenadas.x}%`, top: `${coordenadas.y}%` }}
                />
              )}
            </div>
            {coordenadas && (
              <input className="input-personal" value={`X: ${coordenadas.x}%, Y: ${coordenadas.y}%`} readOnly />
            )}
          </div>
          
          <div className="acciones-form">
            <button type="button" className="boton-verificar ancho-total" onClick={registrar}>Registrar</button>
            <button type="button" className="boton-secundario ancho-total" onClick={modificar}>Modificar</button>
            <button type="button" className="boton-peligro ancho-total" onClick={eliminar}>Eliminar</button>
            <button type="button" className="boton-terciario ancho-total" onClick={limpiar}>Limpiar</button>
          </div>

          {mensaje && <div className="resultado-ok">{mensaje}</div>}
        </form>

        {/* Consulta */}
        <div className="panel panel-consulta">
          <h2 className="subtitulo">Consulta / Selección</h2>

          <div className="filter-row">
            <select className="input-personal" value={filtro.tipo} onChange={(e) => setFiltro(prev => ({ ...prev, tipo: e.target.value }))}>
              <option value="">Tipo</option>
              {tiposEmergenciaDB.map(t => <option key={t.id_tipo_emergencia} value={t.nombre}>{t.nombre}</option>)}
            </select>

            <select className="input-personal" value={filtro.severidad} onChange={(e) => setFiltro(prev => ({ ...prev, severidad: e.target.value }))}>
              <option value="">Severidad</option>
              {nivelesDB.map(n => <option key={n.id_nivel} value={n.nombre}>{n.nombre}</option>)}
            </select>

            <select className="input-personal" value={filtro.id_zona} onChange={(e) => setFiltro(prev => ({ ...prev, id_zona: e.target.value }))}>
              <option value="">Zona</option>
              {zonasDB.map(z => <option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>)}
            </select>

            <input type="date" className="input-personal" value={filtro.fecha} onChange={(e) => setFiltro(prev => ({ ...prev, fecha: e.target.value }))} />
            <input type="time" className="input-personal" value={filtro.hora} onChange={(e) => setFiltro(prev => ({ ...prev, hora: e.target.value }))} />
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <table className="result-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Zona</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Coordenadas</th>
                  <th>Afectado</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {listadoFiltrado.map((r) => (
                  <tr
                    key={r.id_emergencia}
                    className={r.id_emergencia === seleccionId ? 'fila-seleccionada' : ''}
                    onClick={() => seleccionarFila(r)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{r.id_emergencia}</td>
                    <td>{r.tipo_nombre}</td>
                    <td>{r.nivel_nombre}</td>
                    <td>{r.nombre_zona}</td>
                    <td>{r.fecha}</td>
                    <td>{r.hora}</td>
                    <td>{(r.coordenada_x !== null && r.coordenada_y !== null) ? `${r.coordenada_x}%, ${r.coordenada_y}%` : ''}</td>
                    <td>
                      {r.afectado_tipo === 'general' ? 'General' :
                        r.afectado_tipo === 'pasajero' ? 'Pasajero' :
                          'Empleado'}
                    </td>
                    <td>{r.descripcion}</td>
                  </tr>
                ))}
                {listadoFiltrado.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 12 }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}