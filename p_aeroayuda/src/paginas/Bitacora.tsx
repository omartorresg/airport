import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/bitacora.css";

type Emergencia = {
  id_emergencia: number;
  id_tipo: number;
  id_nivel: number;
  id_zona: number | null;
  descripcion: string | null;
  fecha_hora: string;
  tipo_nombre?: string;
  nivel_nombre?: string;
  zona_nombre?: string | null;
};

type Empleado = {
  id_personal: number;
  nombre: string;
  estado?: string;
};

type BitacoraRow = {
  id_bitacora: number;
  id_emergencia: number;
  actor_id: number | null;
  accion_tipo: "anotacion" | "reporte" | "cierre" | "apoyo" | "traslado" | "contencion" | "otro";
  descripcion: string | null;
  tiempo_respuesta: string | null; // "HH:MM:SS" desde Postgres
  evidencia_url: string | null;
  evidencia_tipo: string | null;
  ubicacion_detallada: string | null;
  prioridad: "baja" | "media" | "alta" | "critica";
  clasificacion: "operativa" | "tecnica" | "medica" | "seguridad" | "otro";
  visibilidad_publica: boolean;
  created_at: string;

  // decorado para UI
  emergencia_txt?: string;
  actor_txt?: string;
};

type Tipo = { id_tipo_emergencia: number; nombre: string };
type Nivel = { id_nivel: number; nombre: string };
type Zona = { id_zona: number; nombre_zona: string };

export default function BitacoraIncidente() {
  // catálogos
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // formulario
  const [idEmergencia, setIdEmergencia] = useState<string>("");
  const [actorId, setActorId] = useState<string>("");
  const [accion_tipo, setAccionTipo] = useState<BitacoraRow["accion_tipo"]>("anotacion");
  const [descripcion, setDescripcion] = useState<string>("");
  const [tiempoHHMM, setTiempoHHMM] = useState<string>(""); // input type="time" → "HH:MM"
  const [evidenciaUrl, setEvidenciaUrl] = useState<string>("");
  const [evidenciaTipo, setEvidenciaTipo] = useState<string>(""); // foto, video, doc, enlace…
  const [ubicacionDetallada, setUbicacionDetallada] = useState<string>("");
  const [prioridad, setPrioridad] = useState<BitacoraRow["prioridad"]>("media");
  const [clasificacion, setClasificacion] = useState<BitacoraRow["clasificacion"]>("operativa");
  const [visibilidadPublica, setVisibilidadPublica] = useState<boolean>(false);

  const [mensaje, setMensaje] = useState<string>("");
  const [listado, setListado] = useState<BitacoraRow[]>([]);
  const [seleccionId, setSeleccionId] = useState<number | null>(null);

  // filtros
  const [filtro, setFiltro] = useState<{
    emergencia: string;
    actor: string;
    prioridad: "" | BitacoraRow["prioridad"];
    clasificacion: "" | BitacoraRow["clasificacion"];
  }>({
    emergencia: "",
    actor: "",
    prioridad: "",
    clasificacion: "",
  });

  useEffect(() => {
    const cargar = async () => {
      // catálogos básicos
      const { data: t } = await supabase.from("tipos_emergencia").select("id_tipo_emergencia,nombre").order("nombre");
      const { data: n } = await supabase.from("niveles_severidad").select("id_nivel,nombre").order("nombre");
      const { data: z } = await supabase.from("zonas").select("id_zona,nombre_zona").order("nombre_zona");
      setTipos(t || []);
      setNiveles(n || []);
      setZonas(z || []);

      // emergencias
      const { data: e } = await supabase
        .from("emergencias")
        .select("id_emergencia,id_tipo,id_nivel,id_zona,descripcion,fecha_hora")
        .order("id_emergencia", { ascending: false });

      const decoradas: Emergencia[] = (e || []).map((row: any) => ({
        ...row,
        tipo_nombre: (t || []).find((x) => x.id_tipo_emergencia === row.id_tipo)?.nombre,
        nivel_nombre: (n || []).find((x) => x.id_nivel === row.id_nivel)?.nombre,
        zona_nombre: (z || []).find((zz) => zz.id_zona === row.id_zona)?.nombre_zona || null,
      }));
      setEmergencias(decoradas);

      // empleados (solo activos, opcional)
      const { data: emp } = await supabase
        .from("personal_operativo")
        .select("id_personal,nombre,estado")
        .order("nombre");
      setEmpleados((emp || []).filter((e: any) => e.estado !== "inactivo"));

      await cargarBitacora(decoradas, emp || []);
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarBitacora = async (emgOpt?: Emergencia[], empOpt?: Empleado[]) => {
    const { data: b } = await supabase
      .from("bitacora_incidente")
      .select(
        "id_bitacora,id_emergencia,actor_id,accion_tipo,descripcion,tiempo_respuesta,evidencia_url,evidencia_tipo,ubicacion_detallada,prioridad,clasificacion,visibilidad_publica,created_at"
      )
      .order("id_bitacora", { ascending: false });

    const emg = emgOpt ?? emergencias;
    const emps = empOpt ?? empleados;

    const dec: BitacoraRow[] = (b || []).map((row: any) => {
      const e = emg.find((x) => x.id_emergencia === row.id_emergencia);
      const emp = emps.find((x) => x.id_personal === row.actor_id);
      const fecha = e?.fecha_hora ? e.fecha_hora.replace("T", " ").slice(0, 16) : "";
      return {
        ...row,
        emergencia_txt: e ? `#${e.id_emergencia} · ${e.tipo_nombre} · ${e.nivel_nombre} · ${fecha}` : `#${row.id_emergencia}`,
        actor_txt: emp ? `${emp.nombre} (ID ${emp.id_personal})` : row.actor_id ? `ID ${row.actor_id}` : "—",
      };
    });

    setListado(dec);
  };

  const limpiar = () => {
    setIdEmergencia("");
    setActorId("");
    setAccionTipo("anotacion");
    setDescripcion("");
    setTiempoHHMM("");
    setEvidenciaUrl("");
    setEvidenciaTipo("");
    setUbicacionDetallada("");
    setPrioridad("media");
    setClasificacion("operativa");
    setVisibilidadPublica(false);
    setSeleccionId(null);
    setMensaje("");
  };

  const validar = () => {
    if (!idEmergencia) return "Selecciona la emergencia.";
    if (!actorId) return "Selecciona el actor (empleado).";
    if (!accion_tipo) return "Selecciona el tipo de acción.";
    if (!prioridad) return "Selecciona la prioridad.";
    if (!clasificacion) return "Selecciona la clasificación.";
    return "";
  };

  const registrar = async () => {
    setMensaje("");
    if (seleccionId !== null) {
      setMensaje("❌ Estás en edición. Usa “Modificar” o limpia el formulario.");
      return;
    }
    const err = validar();
    if (err) {
      setMensaje("❌ " + err);
      return;
    }

    const tiempo_respuesta = tiempoHHMM ? `${tiempoHHMM}:00` : null;

    const { error } = await supabase.from("bitacora_incidente").insert({
      id_emergencia: parseInt(idEmergencia, 10),
      actor_id: parseInt(actorId, 10),
      accion_tipo,
      descripcion: descripcion?.trim() || null,
      tiempo_respuesta,
      evidencia_url: evidenciaUrl?.trim() || null,
      evidencia_tipo: evidenciaTipo?.trim() || null,
      ubicacion_detallada: ubicacionDetallada?.trim() || null,
      prioridad,
      clasificacion,
      visibilidad_publica: visibilidadPublica,
    });

    if (error) {
      setMensaje("❌ Error al registrar: " + error.message);
      return;
    }

    setMensaje("✅ Bitácora registrada.");
    await cargarBitacora();
    limpiar();
  };

  const seleccionarFila = (row: BitacoraRow) => {
    setSeleccionId(row.id_bitacora);
    setIdEmergencia(String(row.id_emergencia));
    setActorId(row.actor_id ? String(row.actor_id) : "");
    setAccionTipo(row.accion_tipo);
    setDescripcion(row.descripcion || "");
    setTiempoHHMM(row.tiempo_respuesta ? row.tiempo_respuesta.slice(0, 5) : ""); // "HH:MM"
    setEvidenciaUrl(row.evidencia_url || "");
    setEvidenciaTipo(row.evidencia_tipo || "");
    setUbicacionDetallada(row.ubicacion_detallada || "");
    setPrioridad(row.prioridad);
    setClasificacion(row.clasificacion);
    setVisibilidadPublica(!!row.visibilidad_publica);
    setMensaje("ℹ️ Modo edición.");
  };

  const modificar = async () => {
    setMensaje("");
    if (seleccionId === null) {
      setMensaje("❌ No hay registro seleccionado para modificar.");
      return;
    }
    const err = validar();
    if (err) {
      setMensaje("❌ " + err);
      return;
    }

    const tiempo_respuesta = tiempoHHMM ? `${tiempoHHMM}:00` : null;

    const { error } = await supabase
      .from("bitacora_incidente")
      .update({
        id_emergencia: parseInt(idEmergencia, 10),
        actor_id: parseInt(actorId, 10),
        accion_tipo,
        descripcion: descripcion?.trim() || null,
        tiempo_respuesta,
        evidencia_url: evidenciaUrl?.trim() || null,
        evidencia_tipo: evidenciaTipo?.trim() || null,
        ubicacion_detallada: ubicacionDetallada?.trim() || null,
        prioridad,
        clasificacion,
        visibilidad_publica: visibilidadPublica,
      })
      .eq("id_bitacora", seleccionId);

    if (error) {
      setMensaje("❌ Error al modificar: " + error.message);
      return;
    }

    setMensaje("✅ Cambios guardados.");
    await cargarBitacora();
    limpiar();
  };

  const eliminar = async () => {
    setMensaje("");
    if (seleccionId === null) {
      setMensaje("❌ No hay registro seleccionado para eliminar.");
      return;
    }
    if (!window.confirm("¿Eliminar esta entrada de bitácora?")) return;

    const { error } = await supabase.from("bitacora_incidente").delete().eq("id_bitacora", seleccionId);
    if (error) {
      setMensaje("❌ Error al eliminar: " + error.message);
      return;
    }

    setMensaje("🗑️ Registro eliminado.");
    await cargarBitacora();
    limpiar();
  };

  const listadoFiltrado = useMemo(
    () =>
      listado.filter(
        (r) =>
          (!filtro.emergencia || String(r.id_emergencia) === filtro.emergencia) &&
          (!filtro.actor || String(r.actor_id ?? "") === filtro.actor) &&
          (!filtro.prioridad || r.prioridad === filtro.prioridad) &&
          (!filtro.clasificacion || r.clasificacion === filtro.clasificacion)
      ),
    [listado, filtro]
  );

  return (
    <>
      <div className="bit-title-wrap">
        <h1 className="bit-title">Bitácora y Documentación del Evento</h1>
      </div>

      <div className="bit-grid">
        {/* Formulario */}
        <form className="bit-card bit-form" onSubmit={(e) => { e.preventDefault(); registrar(); }}>
          <h2 className="bit-subtitle">Nueva Entrada</h2>

          <label>
            <span className="bit-label">Emergencia</span>
            <select className="bit-input" value={idEmergencia} onChange={(e) => setIdEmergencia(e.target.value)}>
              <option value="">Seleccione</option>
              {emergencias.map((e) => {
                const fecha = e.fecha_hora?.replace("T", " ").slice(0, 16);
                return (
                  <option key={e.id_emergencia} value={e.id_emergencia}>
                    #{e.id_emergencia} · {e.tipo_nombre} · {e.nivel_nombre} · {fecha}
                    {e.zona_nombre ? ` · ${e.zona_nombre}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <span className="bit-label">Actor (empleado)</span>
            <select className="bit-input" value={actorId} onChange={(e) => setActorId(e.target.value)}>
              <option value="">Seleccione</option>
              {empleados.map((emp) => (
                <option key={emp.id_personal} value={emp.id_personal}>
                  {emp.nombre} (ID {emp.id_personal})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="bit-label">Acción</span>
            <select
              className="bit-input"
              value={accion_tipo}
              onChange={(e) => setAccionTipo(e.target.value as BitacoraRow["accion_tipo"])}
            >
              <option value="anotacion">Anotación</option>
              <option value="reporte">Reporte</option>
              <option value="apoyo">Apoyo</option>
              <option value="traslado">Traslado</option>
              <option value="contencion">Contención</option>
              <option value="cierre">Cierre</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <label className="bit-col2">
            <span className="bit-label">Descripción</span>
            <textarea
              className="bit-input"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles de la acción realizada, hallazgos, resultados…"
            />
          </label>

          <label>
            <span className="bit-label">Tiempo de respuesta</span>
            <input
              type="time"
              className="bit-input"
              value={tiempoHHMM}
              onChange={(e) => setTiempoHHMM(e.target.value)}
            />
          </label>

          <label className="bit-col2">
            <span className="bit-label">Ubicación detallada (opcional)</span>
            <input
              className="bit-input"
              value={ubicacionDetallada}
              onChange={(e) => setUbicacionDetallada(e.target.value)}
              placeholder="Ej: Filtro de seguridad A, lado norte, puerta 4"
            />
          </label>

          <label className="bit-col2">
            <span className="bit-label">Evidencia (URL) (opcional)</span>
            <input
              className="bit-input"
              value={evidenciaUrl}
              onChange={(e) => setEvidenciaUrl(e.target.value)}
              placeholder="https://… (foto, video, documento)"
            />
          </label>

          <label>
            <span className="bit-label">Tipo de evidencia</span>
            <select
              className="bit-input"
              value={evidenciaTipo}
              onChange={(e) => setEvidenciaTipo(e.target.value)}
            >
              <option value="">—</option>
              <option value="foto">Foto</option>
              <option value="video">Video</option>
              <option value="documento">Documento</option>
              <option value="enlace">Enlace</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <label>
            <span className="bit-label">Prioridad</span>
            <select
              className="bit-input"
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as BitacoraRow["prioridad"])}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </label>

          <label>
            <span className="bit-label">Clasificación</span>
            <select
              className="bit-input"
              value={clasificacion}
              onChange={(e) => setClasificacion(e.target.value as BitacoraRow["clasificacion"])}
            >
              <option value="operativa">Operativa</option>
              <option value="tecnica">Técnica</option>
              <option value="medica">Médica</option>
              <option value="seguridad">Seguridad</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <label className="bit-switch bit-col2">
            <input
              type="checkbox"
              checked={visibilidadPublica}
              onChange={(e) => setVisibilidadPublica(e.target.checked)}
            />
            <span>Visible al reporte público</span>
          </label>

          <div className="bit-actions">
            <button type="button" className="bit-btn bit-btn-primary" onClick={registrar}>Registrar</button>
            <button type="button" className="bit-btn bit-btn-secondary" onClick={modificar}>Modificar</button>
            <button type="button" className="bit-btn bit-btn-danger" onClick={eliminar}>Eliminar</button>
            <button type="button" className="bit-btn bit-btn-ghost" onClick={limpiar}>Limpiar</button>
          </div>

          {mensaje && <div className="bit-msg">{mensaje}</div>}
        </form>

        {/* Consulta */}
        <div className="bit-card bit-consulta">
          <h2 className="bit-subtitle">Bitácora</h2>

          <div className="bit-filters">
            <select
              className="bit-input"
              value={filtro.emergencia}
              onChange={(e) => setFiltro((p) => ({ ...p, emergencia: e.target.value }))}
            >
              <option value="">Emergencia</option>
              {emergencias.map((e) => (
                <option key={e.id_emergencia} value={e.id_emergencia}>
                  #{e.id_emergencia} · {e.tipo_nombre} · {e.nivel_nombre}
                </option>
              ))}
            </select>

            <select
              className="bit-input"
              value={filtro.actor}
              onChange={(e) => setFiltro((p) => ({ ...p, actor: e.target.value }))}
            >
              <option value="">Actor</option>
              {empleados.map((emp) => (
                <option key={emp.id_personal} value={emp.id_personal}>
                  {emp.nombre}
                </option>
              ))}
            </select>

            <select
              className="bit-input"
              value={filtro.prioridad}
              onChange={(e) => setFiltro((p) => ({ ...p, prioridad: e.target.value as any }))}
            >
              <option value="">Prioridad</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>

            <select
              className="bit-input"
              value={filtro.clasificacion}
              onChange={(e) => setFiltro((p) => ({ ...p, clasificacion: e.target.value as any }))}
            >
              <option value="">Clasificación</option>
              <option value="operativa">Operativa</option>
              <option value="tecnica">Técnica</option>
              <option value="medica">Médica</option>
              <option value="seguridad">Seguridad</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="bit-table-wrap">
            <table className="bit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Emergencia</th>
                  <th>Actor</th>
                  <th>Acción</th>
                  <th>Tiempo</th>
                  <th>Prioridad</th>
                  <th>Clasificación</th>
                  <th>Pública</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {listadoFiltrado.map((r) => (
                  <tr
                    key={r.id_bitacora}
                    className={r.id_bitacora === seleccionId ? "bit-row-selected" : ""}
                    onClick={() => seleccionarFila(r)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{r.id_bitacora}</td>
                    <td>{r.emergencia_txt}</td>
                    <td>{r.actor_txt}</td>
                    <td>{r.accion_tipo}</td>
                    <td>{r.tiempo_respuesta ? r.tiempo_respuesta.slice(0, 5) : "—"}</td>
                    <td>{r.prioridad}</td>
                    <td>{r.clasificacion}</td>
                    <td>{r.visibilidad_publica ? "Sí" : "No"}</td>
                    <td>{r.created_at?.replace("T", " ").slice(0, 16)}</td>
                  </tr>
                ))}
                {listadoFiltrado.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 12 }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
