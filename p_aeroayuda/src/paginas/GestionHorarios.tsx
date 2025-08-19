import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/gestionHorarios.css";

type Personal = { id_personal: number; nombre: string; estado?: string; };
type Puesto = { id_puesto: number; nombre: string; };

type Turno = {
  id_turno: number;
  id_personal: number;
  tipo: "fijo" | "rotativo";
  fecha_inicio: string;             // YYYY-MM-DD
  fecha_fin: string | null;
  hora_inicio: string;              // HH:MM:SS
  hora_fin: string;                 // HH:MM:SS
  dias_semana: number[];            // [1..7]
  activo: boolean;
  rotacion?: { id_rotacion: number; id_puesto: number; orden: number; puesto_nombre?: string; duracion_min?: number }[];
  personal_nombre?: string;
};

type Ausencia = {
  id_ausencia: number;
  id_personal: number;
  tipo: "ausencia" | "permiso" | "licencia";
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  estado: "aprobado" | "pendiente" | "rechazado";
  personal_nombre?: string;
};

type Marcaje = {
  id_marcaje: number;
  id_personal: number;
  tipo: "entrada" | "salida";
  fecha_hora: string;
  id_turno: number | null;
  observacion: string | null;
  personal_nombre?: string;
};

export default function GestionHorariosTurnos() {
  // pestañas
  const [tab, setTab] = useState<"turnos" | "ausencias" | "marcajes">("turnos");

  // catálogos
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);

  // ====== Turnos ======
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [selTurnoId, setSelTurnoId] = useState<number | null>(null);

  const [tIdPersonal, setTIdPersonal] = useState<string>("");
  const [tTipo, setTTipo] = useState<"fijo" | "rotativo">("fijo");
  const [tFechaInicio, setTFechaInicio] = useState<string>("");
  const [tFechaFin, setTFechaFin] = useState<string>("");
  const [tHoraInicio, setTHoraInicio] = useState<string>("08:00");
  const [tHoraFin, setTHoraFin] = useState<string>("16:00");
  const [tDias, setTDias] = useState<number[]>([1,2,3,4,5]); // L-V por defecto
  // rotación: lista de {id_puesto, orden, duracion_min}
  const [tRotacion, setTRotacion] = useState<{ id_puesto: string; orden: number; duracion_min: number }[]>([]);

  // ====== Ausencias ======
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [selAusId, setSelAusId] = useState<number | null>(null);

  const [aIdPersonal, setAIdPersonal] = useState<string>("");
  const [aTipo, setATipo] = useState<"ausencia" | "permiso" | "licencia">("ausencia");
  const [aFechaInicio, setAFechaInicio] = useState<string>("");
  const [aFechaFin, setAFechaFin] = useState<string>("");
  const [aMotivo, setAMotivo] = useState<string>("");
  const [aEstado, setAEstado] = useState<"aprobado" | "pendiente" | "rechazado">("aprobado");

  // ====== Marcajes ======
  const [marcajes, setMarcajes] = useState<Marcaje[]>([]);
  const [mIdPersonal, setMIdPersonal] = useState<string>("");
  const [mTipo, setMTipo] = useState<"entrada" | "salida">("entrada");
  const [mIdTurno, setMIdTurno] = useState<string>("");
  const [mObs, setMObs] = useState<string>("");

  // ====== mensajes ======
  const [msg, setMsg] = useState<string>("");

  // cargar catálogos y datos
  useEffect(() => {
    const cargar = async () => {
      const { data: per } = await supabase.from("personal_operativo").select("id_personal,nombre,estado").order("nombre");
      setPersonal(per || []);

      const { data: pu } = await supabase.from("puestos").select("id_puesto,nombre").order("nombre");
      setPuestos(pu || []);

      await cargarTurnos(per || [], pu || []);
      await cargarAusencias(per || []);
      await cargarMarcajes(per || []);
    };
    cargar();
  }, []);

  // ====== helpers ======
  const nombrePersonal = (id: number | null | undefined) =>
    personal.find(p => p.id_personal === id)?.nombre || "—";

  const nombrePuesto = (id: number) =>
    puestos.find(p => p.id_puesto === id)?.nombre || `#${id}`;

  // Helpers para validación de tiempo
  const parseHHMM = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const minutosEntre = (horaInicio: string, horaFin: string) => {
    const ini = parseHHMM(horaInicio);
    const fin = parseHHMM(horaFin);
    // si cruza medianoche, ajusta:
    return fin >= ini ? fin - ini : (24 * 60 - ini) + fin;
  };

  // ====== TURNOS ======
  const cargarTurnos = async (perOpt?: Personal[], puOpt?: Puesto[]) => {
    const { data: t } = await supabase
      .from("turnos")
      .select("id_turno,id_personal,tipo,fecha_inicio,fecha_fin,hora_inicio,hora_fin,dias_semana,activo")
      .order("id_turno", { ascending: false });

    const turnoIds = (t || []).map((x:any) => x.id_turno);
    let rotMap: Record<number, any[]> = {};
    if (turnoIds.length) {
      const { data: r } = await supabase
        .from("turnos_rotacion")
        .select("id_rotacion,id_turno,id_puesto,orden,duracion_min")
        .in("id_turno", turnoIds)
        .order("orden", { ascending: true });
      (r || []).forEach((row:any) => {
        rotMap[row.id_turno] = rotMap[row.id_turno] || [];
        rotMap[row.id_turno].push(row);
      });
    }

    const per = perOpt ?? personal;
    const pu  = puOpt ?? puestos;

    const decorados: Turno[] = (t || []).map((row:any) => ({
      ...row,
      personal_nombre: per.find(p => p.id_personal === row.id_personal)?.nombre,
      rotacion: (rotMap[row.id_turno] || []).map(rr => ({
        ...rr,
        puesto_nombre: pu.find(p => p.id_puesto === rr.id_puesto)?.nombre
      }))
    }));

    setTurnos(decorados);
  };

  const toggleDia = (dia: number) => {
    setTDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort((a,b)=>a-b));
  };

  const agregarLineaRotacion = () => {
    setTRotacion(prev => [...prev, { id_puesto: "", orden: (prev[prev.length-1]?.orden ?? 0) + 1, duracion_min: 0 }]);
  };

  const quitarLineaRotacion = (idx: number) => {
    setTRotacion(prev => prev.filter((_,i)=>i!==idx));
  };

  const limpiarTurno = () => {
    setSelTurnoId(null);
    setTIdPersonal("");
    setTTipo("fijo");
    setTFechaInicio("");
    setTFechaFin("");
    setTHoraInicio("08:00");
    setTHoraFin("16:00");
    setTDias([1,2,3,4,5]);
    setTRotacion([]);
    setMsg("");
  };

  const validarTurno = () => {
    if (!tIdPersonal) return "Selecciona personal.";
    if (!tFechaInicio) return "Ingresa fecha de inicio.";
    if (!tHoraInicio || !tHoraFin) return "Ingresa hora inicio y hora fin.";
    if (!tDias.length) return "Selecciona al menos un día.";
    if (tTipo === "rotativo" && tRotacion.length === 0) return "Agrega al menos un puesto en la rotación.";
    if (tTipo === "rotativo" && tRotacion.some(r => !r.id_puesto)) return "Completa los puestos en la rotación.";

    if (tTipo === "rotativo") {
      const totalTurno = minutosEntre(tHoraInicio, tHoraFin);
      const sumaRotacion = tRotacion.reduce((acc, r) => acc + (r.duracion_min || 0), 0);
      if (sumaRotacion !== totalTurno) {
        return `❌ La suma de duraciones en la rotación (${sumaRotacion} min) no coincide con la duración del turno (${totalTurno} min).`;
      }
    }

    return "";
  };

  const registrarTurno = async () => {
    setMsg("");
    if (selTurnoId !== null) {
      setMsg("❌ Estás editando. Usa “Modificar” o limpia el formulario.");
      return;
    }
    const err = validarTurno();
    if (err) { setMsg(err); return; }

    const { data: ins, error } = await supabase
      .from("turnos")
      .insert({
        id_personal: parseInt(tIdPersonal, 10),
        tipo: tTipo,
        fecha_inicio: tFechaInicio,
        fecha_fin: tFechaFin || null,
        hora_inicio: tHoraInicio + (tHoraInicio.length === 5 ? ":00" : ""),
        hora_fin: tHoraFin + (tHoraFin.length === 5 ? ":00" : ""),
        dias_semana: tDias,
        activo: true
      })
      .select("id_turno")
      .single();

    if (error || !ins) { setMsg("❌ Error al registrar turno: " + (error?.message || "")); return; }

    const id_turno = ins.id_turno as number;

    if (tTipo === "rotativo" && tRotacion.length) {
      const payload = tRotacion.map(r => ({
        id_turno,
        id_puesto: parseInt(r.id_puesto, 10),
        orden: r.orden,
        duracion_min: r.duracion_min
      }));
      const { error: e2 } = await supabase.from("turnos_rotacion").insert(payload);
      if (e2) { setMsg("❌ Rotación: " + e2.message); return; }
    }

    setMsg("✅ Turno registrado.");
    await cargarTurnos();
    limpiarTurno();
  };

  const seleccionarTurno = (t: Turno) => {
    setSelTurnoId(t.id_turno);
    setTIdPersonal(String(t.id_personal));
    setTTipo(t.tipo);
    setTFechaInicio(t.fecha_inicio);
    setTFechaFin(t.fecha_fin || "");
    setTHoraInicio(t.hora_inicio.slice(0,5));
    setTHoraFin(t.hora_fin.slice(0,5));
    setTDias(t.dias_semana || []);
    setTRotacion((t.rotacion || []).map(r => ({
      id_puesto: String(r.id_puesto),
      orden: r.orden,
      duracion_min: r.duracion_min || 0
    })));
    setMsg("ℹ️ Modo edición de turno.");
  };

  const modificarTurno = async () => {
    setMsg("");
    if (selTurnoId === null) { setMsg("❌ No hay turno seleccionado."); return; }
    const err = validarTurno();
    if (err) { setMsg(err); return; }

    const { error } = await supabase
      .from("turnos")
      .update({
        id_personal: parseInt(tIdPersonal, 10),
        tipo: tTipo,
        fecha_inicio: tFechaInicio,
        fecha_fin: tFechaFin || null,
        hora_inicio: tHoraInicio + (tHoraInicio.length === 5 ? ":00" : ""),
        hora_fin: tHoraFin + (tHoraFin.length === 5 ? ":00" : ""),
        dias_semana: tDias,
        activo: true
      })
      .eq("id_turno", selTurnoId);

    if (error) { setMsg("❌ Error al modificar: " + error.message); return; }

    // reescribir rotación
    await supabase.from("turnos_rotacion").delete().eq("id_turno", selTurnoId);
    if (tTipo === "rotativo" && tRotacion.length) {
      const payload = tRotacion.map(r => ({
        id_turno: selTurnoId,
        id_puesto: parseInt(r.id_puesto, 10),
        orden: r.orden,
        duracion_min: r.duracion_min
      }));
      const { error: e2 } = await supabase.from("turnos_rotacion").insert(payload);
      if (e2) { setMsg("❌ Rotación: " + e2.message); return; }
    }

    setMsg("✅ Cambios guardados.");
    await cargarTurnos();
    limpiarTurno();
  };

  const eliminarTurno = async () => {
    setMsg("");
    if (selTurnoId === null) { setMsg("❌ No hay turno seleccionado."); return; }
    if (!window.confirm("¿Eliminar este turno?")) return;

    const { error } = await supabase.from("turnos").delete().eq("id_turno", selTurnoId);
    if (error) { setMsg("❌ Error al eliminar: " + error.message); return; }

    setMsg("🗑️ Turno eliminado.");
    await cargarTurnos();
    limpiarTurno();
  };

  // ====== AUSENCIAS ======
  const cargarAusencias = async (perOpt?: Personal[]) => {
    const { data: a } = await supabase
      .from("ausencias")
      .select("id_ausencia,id_personal,tipo,fecha_inicio,fecha_fin,motivo,estado")
      .order("id_ausencia", { ascending: false });

    const per = perOpt ?? personal;
    setAusencias((a || []).map((x:any) => ({
      ...x, personal_nombre: per.find(p => p.id_personal === x.id_personal)?.nombre
    })));
  };

  const limpiarAus = () => {
    setSelAusId(null);
    setAIdPersonal("");
    setATipo("ausencia");
    setAFechaInicio("");
    setAFechaFin("");
    setAMotivo("");
    setAEstado("aprobado");
    setMsg("");
  };

  const validarAus = () => {
    if (!aIdPersonal) return "Selecciona personal.";
    if (!aFechaInicio || !aFechaFin) return "Completa el rango de fechas.";
    return "";
  };

  const registrarAus = async () => {
    setMsg("");
    if (selAusId !== null) { setMsg("❌ Estás editando. Usa “Modificar”."); return; }
    const err = validarAus();
    if (err) { setMsg("❌ " + err); return; }

    const { error } = await supabase.from("ausencias").insert({
      id_personal: parseInt(aIdPersonal, 10),
      tipo: aTipo,
      fecha_inicio: aFechaInicio,
      fecha_fin: aFechaFin,
      motivo: aMotivo.trim() || null,
      estado: aEstado
    });
    if (error) { setMsg("❌ Error al registrar ausencia: " + error.message); return; }

    setMsg("✅ Ausencia/permiso/licencia registrada.");
    await cargarAusencias();
    limpiarAus();
  };

  const seleccionarAus = (a: Ausencia) => {
    setSelAusId(a.id_ausencia);
    setAIdPersonal(String(a.id_personal));
    setATipo(a.tipo);
    setAFechaInicio(a.fecha_inicio);
    setAFechaFin(a.fecha_fin);
    setAMotivo(a.motivo || "");
    setAEstado(a.estado);
    setMsg("ℹ️ Modo edición de ausencia.");
  };

  const modificarAus = async () => {
    setMsg("");
    if (selAusId === null) { setMsg("❌ No hay registro seleccionado."); return; }
    const err = validarAus();
    if (err) { setMsg("❌ " + err); return; }

    const { error } = await supabase.from("ausencias").update({
      id_personal: parseInt(aIdPersonal, 10),
      tipo: aTipo,
      fecha_inicio: aFechaInicio,
      fecha_fin: aFechaFin,
      motivo: aMotivo.trim() || null,
      estado: aEstado
    }).eq("id_ausencia", selAusId);
    if (error) { setMsg("❌ Error al modificar: " + error.message); return; }

    setMsg("✅ Cambios guardados.");
    await cargarAusencias();
    limpiarAus();
  };

  const eliminarAus = async () => {
    setMsg("");
    if (selAusId === null) { setMsg("❌ No hay registro seleccionado."); return; }
    if (!window.confirm("¿Eliminar este registro?")) return;

    const { error } = await supabase.from("ausencias").delete().eq("id_ausencia", selAusId);
    if (error) { setMsg("❌ Error al eliminar: " + error.message); return; }

    setMsg("🗑️ Registro eliminado.");
    await cargarAusencias();
    limpiarAus();
  };

  // ====== MARCAJES ======
  const cargarMarcajes = async (perOpt?: Personal[]) => {
    const { data: m } = await supabase
      .from("marcajes")
      .select("id_marcaje,id_personal,tipo,fecha_hora,id_turno,observacion")
      .order("id_marcaje", { ascending: false });

    const per = perOpt ?? personal;
    setMarcajes((m || []).map((x:any) => ({
      ...x, personal_nombre: per.find(p => p.id_personal === x.id_personal)?.nombre
    })));
  };

  const limpiarMarcaje = () => {
    setMIdPersonal("");
    setMTipo("entrada");
    setMIdTurno("");
    setMObs("");
    setMsg("");
  };

  const registrarMarcaje = async () => {
    setMsg("");
    if (!mIdPersonal) { setMsg("❌ Selecciona personal."); return; }

    const { error } = await supabase.from("marcajes").insert({
      id_personal: parseInt(mIdPersonal, 10),
      tipo: mTipo,
      id_turno: mIdTurno ? parseInt(mIdTurno, 10) : null,
      observacion: mObs.trim() || null
    });
    if (error) { setMsg("❌ Error al registrar marcaje: " + error.message); return; }

    setMsg("✅ Marcaje registrado.");
    await cargarMarcajes();
    limpiarMarcaje();
  };

  // filtro turnos por personal para combo de marcaje
  const turnosDePersonal = useMemo(
    () => (pid: string) => turnos.filter(t => String(t.id_personal) === pid),
    [turnos]
  );

  // dias utilitarios
  const diasTxt = (arr:number[]) => {
    const map = ["L","M","X","J","V","S","D"];
    return arr.sort((a,b)=>a-b).map(d=>map[d-1]).join("");
  };

  return (
    <>
      {/* Título */}
      <div className="hrt-title-wrap"><h1 className="hrt-title">Gestión de Horarios y Turnos</h1></div>

      <div className="hrt-grid">
        {/* ===== Tabs ===== */}
        <div className="hrt-tabs">
          <button className={`hrt-tab ${tab==='turnos'?'active':''}`} onClick={()=>setTab("turnos")}>Turnos</button>
          <button className={`hrt-tab ${tab==='ausencias'?'active':''}`} onClick={()=>setTab("ausencias")}>Ausencias / Permisos</button>
          <button className={`hrt-tab ${tab==='marcajes'?'active':''}`} onClick={()=>setTab("marcajes")}>Check-in / Check-out</button>
        </div>

        {/* ===== CONTENIDO ===== */}
        {tab === "turnos" && (
          <div className="hrt-2col">
            {/* Formulario Turnos */}
            <form className="hrt-card hrt-form" onSubmit={(e)=>{ e.preventDefault(); registrarTurno(); }}>
              <h2 className="hrt-subtitle">Turnos (fijos / rotativos)</h2>

              <label>
                <span className="hrt-label">Personal</span>
                <select className="hrt-input" value={tIdPersonal} onChange={(e)=>setTIdPersonal(e.target.value)}>
                  <option value="">Seleccione</option>
                  {personal.map(p => <option key={p.id_personal} value={p.id_personal}>{p.nombre}</option>)}
                </select>
              </label>

              <label>
                <span className="hrt-label">Tipo</span>
                <select className="hrt-input" value={tTipo} onChange={(e)=>setTTipo(e.target.value as any)}>
                  <option value="fijo">fijo</option>
                  <option value="rotativo">rotativo</option>
                </select>
              </label>

              <label>
                <span className="hrt-label">Fecha inicio</span>
                <input type="date" className="hrt-input" value={tFechaInicio} onChange={(e)=>setTFechaInicio(e.target.value)} />
              </label>

              <label>
                <span className="hrt-label">Fecha fin (opcional)</span>
                <input type="date" className="hrt-input" value={tFechaFin} onChange={(e)=>setTFechaFin(e.target.value)} />
              </label>

              <label>
                <span className="hrt-label">Hora inicio</span>
                <input type="time" className="hrt-input" value={tHoraInicio} onChange={(e)=>setTHoraInicio(e.target.value)} />
              </label>

              <label>
                <span className="hrt-label">Hora fin</span>
                <input type="time" className="hrt-input" value={tHoraFin} onChange={(e)=>setTHoraFin(e.target.value)} />
              </label>

              <div className="hrt-col2">
                <span className="hrt-label">Días de la semana</span>
                <div className="hrt-days">
                  {[
                    {n:1,l:"Lun"},{n:2,l:"Mar"},{n:3,l:"Mié"},{n:4,l:"Jue"},{n:5,l:"Vie"},{n:6,l:"Sáb"},{n:7,l:"Dom"}
                  ].map(d => (
                    <label key={d.n} className={`hrt-day ${tDias.includes(d.n)?'on':''}`}>
                      <input type="checkbox" checked={tDias.includes(d.n)} onChange={()=>toggleDia(d.n)} />
                      {d.l}
                    </label>
                  ))}
                </div>
              </div>

              {tTipo === "rotativo" && (
                <div className="hrt-col2">
                  <span className="hrt-label">Rotación de puestos</span>
                  <div className="hrt-rotacion">
                    {tRotacion.map((r,idx)=>(
                      <div className="hrt-rot-row" key={idx}>
                        <select className="hrt-input" value={r.id_puesto} onChange={(e)=>{
                          const v = e.target.value;
                          setTRotacion(prev => prev.map((x,i)=> i===idx ? {...x, id_puesto:v} : x));
                        }}>
                          <option value="">Puesto...</option>
                          {puestos.map(p => <option key={p.id_puesto} value={p.id_puesto}>{p.nombre}</option>)}
                        </select>
                        <input className="hrt-input" type="number" min={1} value={r.orden} onChange={(e)=>{
                          const v = parseInt(e.target.value||"1",10);
                          setTRotacion(prev => prev.map((x,i)=> i===idx ? {...x, orden:v} : x));
                        }} />
                        <input className="hrt-input" type="number" min={1} value={r.duracion_min} onChange={(e)=>{
                          const v = parseInt(e.target.value||"0",10);
                          setTRotacion(prev => prev.map((x,i)=> i===idx ? {...x, duracion_min:v} : x));
                        }} placeholder="Duración (min)" />
                        <button type="button" className="hrt-btn hrt-btn-danger" onClick={()=>quitarLineaRotacion(idx)}>Quitar</button>
                      </div>
                    ))}
                    <button type="button" className="hrt-btn hrt-btn-secondary" onClick={agregarLineaRotacion}>+ Añadir puesto</button>
                  </div>
                </div>
              )}

              <div className="hrt-actions">
                <button type="button" className="hrt-btn hrt-btn-primary" onClick={registrarTurno}>Registrar</button>
                <button type="button" className="hrt-btn hrt-btn-secondary" onClick={modificarTurno}>Modificar</button>
                <button type="button" className="hrt-btn hrt-btn-danger" onClick={eliminarTurno}>Eliminar</button>
                <button type="button" className="hrt-btn hrt-btn-ghost" onClick={limpiarTurno}>Limpiar</button>
              </div>

              {msg && <div className="hrt-msg">{msg}</div>}
            </form>

            {/* Consulta Turnos */}
            <div className="hrt-card hrt-consulta">
              <h2 className="hrt-subtitle">Turnos registrados</h2>
              <div className="hrt-table-wrap">
                <table className="hrt-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Personal</th>
                      <th>Tipo</th>
                      <th>Rango Fecha</th>
                      <th>Horas</th>
                      <th>Días</th>
                      <th>Rotación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnos.map(t => (
                      <tr key={t.id_turno} onClick={()=>seleccionarTurno(t)} className={t.id_turno===selTurnoId?"hrt-row-selected":""} style={{cursor:"pointer"}}>
                        <td>{t.id_turno}</td>
                        <td>{t.personal_nombre || nombrePersonal(t.id_personal)}</td>
                        <td>{t.tipo}</td>
                        <td>{t.fecha_inicio}{t.fecha_fin ? ` → ${t.fecha_fin}` : ""}</td>
                        <td>{t.hora_inicio.slice(0,5)}–{t.hora_fin.slice(0,5)}</td>
                        <td>{diasTxt(t.dias_semana || [])}</td>
                        <td>{(t.rotacion||[]).map(r=>`${r.puesto_nombre} (${r.duracion_min} min)`).join(", ") || "—"}</td>
                      </tr>
                    ))}
                    {turnos.length===0 && (
                      <tr><td colSpan={7} style={{textAlign:"center",padding:12}}>Sin registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "ausencias" && (
          <div className="hrt-2col">
            {/* Form Ausencias */}
            <form className="hrt-card hrt-form" onSubmit={(e)=>{ e.preventDefault(); registrarAus(); }}>
              <h2 className="hrt-subtitle">Ausencias / Permisos / Licencias</h2>

              <label>
                <span className="hrt-label">Personal</span>
                <select className="hrt-input" value={aIdPersonal} onChange={(e)=>setAIdPersonal(e.target.value)}>
                  <option value="">Seleccione</option>
                  {personal.map(p => <option key={p.id_personal} value={p.id_personal}>{p.nombre}</option>)}
                </select>
              </label>

              <label>
                <span className="hrt-label">Tipo</span>
                <select className="hrt-input" value={aTipo} onChange={(e)=>setATipo(e.target.value as any)}>
                  <option value="ausencia">ausencia</option>
                  <option value="permiso">permiso</option>
                  <option value="licencia">licencia</option>
                </select>
              </label>

              <label>
                <span className="hrt-label">Fecha inicio</span>
                <input type="date" className="hrt-input" value={aFechaInicio} onChange={(e)=>setAFechaInicio(e.target.value)} />
              </label>

              <label>
                <span className="hrt-label">Fecha fin</span>
                <input type="date" className="hrt-input" value={aFechaFin} onChange={(e)=>setAFechaFin(e.target.value)} />
              </label>

              <label className="hrt-col2">
                <span className="hrt-label">Motivo</span>
                <textarea className="hrt-input" rows={3} value={aMotivo} onChange={(e)=>setAMotivo(e.target.value)} />
              </label>

              <label>
                <span className="hrt-label">Estado</span>
                <select className="hrt-input" value={aEstado} onChange={(e)=>setAEstado(e.target.value as any)}>
                  <option value="aprobado">aprobado</option>
                  <option value="pendiente">pendiente</option>
                  <option value="rechazado">rechazado</option>
                </select>
              </label>

              <div className="hrt-actions">
                <button type="button" className="hrt-btn hrt-btn-primary" onClick={registrarAus}>Registrar</button>
                <button type="button" className="hrt-btn hrt-btn-secondary" onClick={modificarAus}>Modificar</button>
                <button type="button" className="hrt-btn hrt-btn-danger" onClick={eliminarAus}>Eliminar</button>
                <button type="button" className="hrt-btn hrt-btn-ghost" onClick={limpiarAus}>Limpiar</button>
              </div>

              {msg && <div className="hrt-msg">{msg}</div>}
            </form>

            {/* Consulta Ausencias */}
            <div className="hrt-card hrt-consulta">
              <h2 className="hrt-subtitle">Registros</h2>
              <div className="hrt-table-wrap">
                <table className="hrt-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Personal</th>
                      <th>Tipo</th>
                      <th>Rango</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ausencias.map(a => (
                      <tr key={a.id_ausencia} onClick={()=>seleccionarAus(a)} className={a.id_ausencia===selAusId?"hrt-row-selected":""} style={{cursor:"pointer"}}>
                        <td>{a.id_ausencia}</td>
                        <td>{a.personal_nombre || nombrePersonal(a.id_personal)}</td>
                        <td>{a.tipo}</td>
                        <td>{a.fecha_inicio} → {a.fecha_fin}</td>
                        <td>{a.estado}</td>
                      </tr>
                    ))}
                    {ausencias.length===0 && (
                      <tr><td colSpan={5} style={{textAlign:"center",padding:12}}>Sin registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "marcajes" && (
          <div className="hrt-2col">
            {/* Form Marcajes */}
            <form className="hrt-card hrt-form" onSubmit={(e)=>{ e.preventDefault(); registrarMarcaje(); }}>
              <h2 className="hrt-subtitle">Check-in / Check-out</h2>

              <label>
                <span className="hrt-label">Personal</span>
                <select className="hrt-input" value={mIdPersonal} onChange={(e)=>setMIdPersonal(e.target.value)}>
                  <option value="">Seleccione</option>
                  {personal.map(p => <option key={p.id_personal} value={p.id_personal}>{p.nombre}</option>)}
                </select>
              </label>

              <label>
                <span className="hrt-label">Tipo</span>
                <select className="hrt-input" value={mTipo} onChange={(e)=>setMTipo(e.target.value as any)}>
                  <option value="entrada">entrada</option>
                  <option value="salida">salida</option>
                </select>
              </label>

              <label className="hrt-col2">
                <span className="hrt-label">Turno (opcional, su turno activo)</span>
                <select className="hrt-input" value={mIdTurno} onChange={(e)=>setMIdTurno(e.target.value)} disabled={!mIdPersonal}>
                  <option value="">—</option>
                  {mIdPersonal && turnosDePersonal(mIdPersonal).map(t => (
                    <option key={t.id_turno} value={t.id_turno}>
                      #{t.id_turno} · {t.tipo} · {t.hora_inicio.slice(0,5)}–{t.hora_fin.slice(0,5)} · {diasTxt(t.dias_semana||[])}
                    </option>
                  ))}
                </select>
              </label>

              <label className="hrt-col2">
                <span className="hrt-label">Observación</span>
                <input className="hrt-input" value={mObs} onChange={(e)=>setMObs(e.target.value)} placeholder="Opcional: tardanza, relevo, etc." />
              </label>

              <div className="hrt-actions">
                <button type="button" className="hrt-btn hrt-btn-primary" onClick={registrarMarcaje}>Registrar</button>
                <button type="button" className="hrt-btn hrt-btn-ghost" onClick={limpiarMarcaje}>Limpiar</button>
              </div>

              {msg && <div className="hrt-msg">{msg}</div>}
            </form>

            {/* Consulta Marcajes */}
            <div className="hrt-card hrt-consulta">
              <h2 className="hrt-subtitle">Historial de marcajes</h2>
              <div className="hrt-table-wrap">
                <table className="hrt-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Personal</th>
                      <th>Tipo</th>
                      <th>Fecha/Hora</th>
                      <th>Turno</th>
                      <th>Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marcajes.map(m => (
                      <tr key={m.id_marcaje}>
                        <td>{m.id_marcaje}</td>
                        <td>{m.personal_nombre || nombrePersonal(m.id_personal)}</td>
                        <td>{m.tipo}</td>
                        <td>{m.fecha_hora?.replace("T"," ").slice(0,16)}</td>
                        <td>{m.id_turno ?? "—"}</td>
                        <td>{m.observacion || "—"}</td>
                      </tr>
                    ))}
                    {marcajes.length===0 && (
                      <tr><td colSpan={6} style={{textAlign:"center",padding:12}}>Sin registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}