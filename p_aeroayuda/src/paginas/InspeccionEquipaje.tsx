import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/inspeccionEquipaje.css";

type Embarque = {
  id_embarque: number;
  id_pasajero: number;
  id_vuelo: number | null;
  fecha_hora: string | null;
  grupo_abordaje: string | null;
  prioridad: boolean | null;
  estado_embarque: string | null;
};

type Operador = {
  id_personal: number;
  nombre: string;
};

type ObjetoCat = {
  codigo: string;
  nombre: string;
};

type InspeccionRow = {
  id_inspeccion: number;
  id_embarque: number;
  tipo_equipaje: "mano" | "facturado" | "especial";
  numero_vuelo: string;
  resultado: "limpio" | "retener";
  observaciones: string | null;
  evidencia_url: string | null;
  operador_id: number | null;
  id_maleta: number | null;
  fecha_hora: string;
  embarque_txt?: string;
  operador_txt?: string;
};

type Marcador = { x_pct: number; y_pct: number; nota?: string };

export default function InspeccionEquipaje() {
  // catálogos
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [objetos, setObjetos] = useState<ObjetoCat[]>([]);

  // formulario
  const [idEmbarque, setIdEmbarque] = useState<string>("");
  const [tipoEquipaje, setTipoEquipaje] = useState<"mano" | "facturado" | "especial">("mano");
  const [numeroVuelo, setNumeroVuelo] = useState<string>("");
  const [resultado, setResultado] = useState<"limpio" | "retener">("limpio");
  const [observaciones, setObservaciones] = useState<string>("");
  const [evidenciaUrl, setEvidenciaUrl] = useState<string>("");
  const [operadorId, setOperadorId] = useState<string>("");
  const [idMaleta, setIdMaleta] = useState<string>(""); // obligatorio si facturado

  // objetos detectados
  const [objetosDetectados, setObjetosDetectados] = useState<string[]>([]);
  const [otroDetalle, setOtroDetalle] = useState<string>("");

  // marcadores RX
  const [marcadores, setMarcadores] = useState<Marcador[]>([]);
  const [notaActual, setNotaActual] = useState<string>(""); // nota para el próximo marcador (opcional)
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [mensaje, setMensaje] = useState<string>("");

  // listado
  const [inspecciones, setInspecciones] = useState<InspeccionRow[]>([]);
  const [seleccionId, setSeleccionId] = useState<number | null>(null);

  // filtros
  const [filtro, setFiltro] = useState<{ resultado: string; vuelo: string; embarque: string; tipo: string }>({
    resultado: "",
    vuelo: "",
    embarque: "",
    tipo: "",
  });

  useEffect(() => {
    const cargar = async () => {
      const { data: emb } = await supabase
        .from("embarque")
        .select("id_embarque,id_pasajero,id_vuelo,fecha_hora,grupo_abordaje,prioridad,estado_embarque")
        .order("id_embarque", { ascending: false });
      setEmbarques((emb || []) as Embarque[]);

      const { data: ops } = await supabase
        .from("personal_operativo")
        .select("id_personal,nombre")
        .order("nombre");
      setOperadores((ops || []) as Operador[]);

      const { data: cat } = await supabase
        .from("cat_objetos_prohibidos")
        .select("codigo,nombre")
        .order("nombre");
      setObjetos((cat || []) as ObjetoCat[]);

      await cargarInspecciones((emb || []) as Embarque[], (ops || []) as Operador[]);
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const txtEmbarque = (e: Embarque) => {
    const fecha = e.fecha_hora ? e.fecha_hora.replace("T", " ").slice(0, 16) : "";
    return `#${e.id_embarque} · Pasajero ${e.id_pasajero} ${e.id_vuelo ? "· Vuelo " + e.id_vuelo : ""} · ${fecha}`;
  };

  const cargarInspecciones = async (embOpt?: Embarque[], opsOpt?: Operador[]) => {
    const { data: ins } = await supabase
      .from("inspecciones_equipaje")
      .select("id_inspeccion,id_embarque,tipo_equipaje,numero_vuelo,resultado,observaciones,evidencia_url,operador_id,id_maleta,fecha_hora")
      .order("id_inspeccion", { ascending: false });

    const emb = embOpt ?? embarques;
    const ops = opsOpt ?? operadores;

    const decoradas: InspeccionRow[] = (ins || []).map((r: any) => {
      const e = emb.find((x) => x.id_embarque === r.id_embarque);
      const o = ops.find((x) => x.id_personal === r.operador_id);
      return {
        ...r,
        embarque_txt: e ? txtEmbarque(e) : `#${r.id_embarque}`,
        operador_txt: o ? o.nombre : "—",
      };
    });
    setInspecciones(decoradas);
  };

  // === Marcación sobre la imagen ===
  const xrSrc = useMemo(() => "/xraysMaleta.jpg", []);

  const onClickImagen = (ev: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();

    // posición dentro de la imagen en px (imagen se muestra a su tamaño natural)
    const offsetX = ev.clientX - rect.left + imgRef.current.scrollLeft;
    const offsetY = ev.clientY - rect.top + imgRef.current.scrollTop;

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const x_pct = (offsetX / w) * 100;
    const y_pct = (offsetY / h) * 100;

    setMarcadores((prev) => [...prev, { x_pct, y_pct, nota: (notaActual || undefined) }]);
    setNotaActual(""); // limpia la nota para el siguiente punto (opcional)
  };

  const quitarUltimoPunto = () => setMarcadores((prev) => prev.slice(0, -1));
  const limpiarPuntos = () => setMarcadores([]);

  // helpers
  const limpiar = () => {
    setIdEmbarque("");
    setTipoEquipaje("mano");
    setNumeroVuelo("");
    setResultado("limpio");
    setObservaciones("");
    setEvidenciaUrl("");
    setOperadorId("");
    setIdMaleta("");
    setObjetosDetectados([]);
    setOtroDetalle("");
    setMarcadores([]);
    setNotaActual("");
    setSeleccionId(null);
    setMensaje("");
  };

  const validar = () => {
    if (!idEmbarque) return "Selecciona un embarque.";
    if (!numeroVuelo.trim()) return "Ingresa el número de vuelo.";
    if (!tipoEquipaje) return "Selecciona el tipo de equipaje.";
    if (tipoEquipaje === "facturado" && !idMaleta.trim())
      return "Para equipaje facturado, especifica el ID de maleta.";
    if (resultado === "retener" && objetosDetectados.length === 0)
      return "Selecciona al menos un objeto prohibido si el resultado es 'retener'.";
    return "";
  };

  // CRUD
  const registrar = async () => {
    setMensaje("");
    if (seleccionId !== null) {
      setMensaje("❌ Estás en modo edición. Usa “Modificar” o limpia el formulario.");
      return;
    }
    const err = validar();
    if (err) { setMensaje("❌ " + err); return; }

    // 1) Inspección
    const { data: ins, error: e1 } = await supabase
      .from("inspecciones_equipaje")
      .insert({
        id_embarque: parseInt(idEmbarque, 10),
        tipo_equipaje: tipoEquipaje,
        numero_vuelo: numeroVuelo.trim(),
        resultado,
        observaciones: observaciones.trim() || null,
        evidencia_url: evidenciaUrl.trim() || null,
        operador_id: operadorId ? parseInt(operadorId, 10) : null,
        id_maleta: idMaleta ? parseInt(idMaleta, 10) : null,
      })
      .select("id_inspeccion")
      .single();

    if (e1 || !ins) { setMensaje("❌ Error al registrar inspección: " + (e1?.message || "")); return; }

    const id_inspeccion = ins.id_inspeccion as number;

    // 2) Objetos detectados
    if (objetosDetectados.length > 0) {
      const payload = objetosDetectados.map((cod) => ({
        id_inspeccion,
        objeto_codigo: cod,
        descripcion: cod === "otro" ? (otroDetalle.trim() || null) : null,
      }));
      const { error: e2 } = await supabase.from("inspecciones_equipaje_objetos").insert(payload);
      if (e2) { setMensaje("❌ Objetos: " + e2.message); return; }
    }

    // 3) Marcadores RX
    if (marcadores.length > 0) {
      const payloadMarks = marcadores.map((m) => ({
        id_inspeccion,
        x_pct: m.x_pct,
        y_pct: m.y_pct,
        nota: m.nota || null,
      }));
      const { error: e3 } = await supabase.from("inspecciones_equipaje_marcadores").insert(payloadMarks);
      if (e3) { setMensaje("❌ Marcadores: " + e3.message); return; }
    }

    // 4) Retención (si aplica)
    if (resultado === "retener") {
      const { error: e4 } = await supabase.from("retencion_equipaje").insert({
        id_inspeccion,
        tipo_equipaje: tipoEquipaje,
        id_maleta: idMaleta ? parseInt(idMaleta, 10) : null,
      });
      if (e4) { setMensaje("❌ Retención: " + e4.message); return; }
    }

    setMensaje("✅ Inspección registrada con marcadores.");
    await cargarInspecciones();
    limpiar();
  };

  const seleccionarFila = (r: InspeccionRow) => {
    setSeleccionId(r.id_inspeccion);
    setIdEmbarque(String(r.id_embarque));
    setTipoEquipaje(r.tipo_equipaje);
    setNumeroVuelo(r.numero_vuelo);
    setResultado(r.resultado);
    setObservaciones(r.observaciones || "");
    setEvidenciaUrl(r.evidencia_url || "");
    setOperadorId(r.operador_id ? String(r.operador_id) : "");
    setIdMaleta(r.id_maleta ? String(r.id_maleta) : "");
    setObjetosDetectados([]);
    setOtroDetalle("");
    setMarcadores([]);     // (Opcional) podríamos cargar marcadores de esa inspección aquí con otra consulta
    setNotaActual("");
    setMensaje("ℹ️ Modo edición.");
  };

  const modificar = async () => {
    setMensaje("");
    if (seleccionId === null) { setMensaje("❌ No hay inspección seleccionada."); return; }
    const err = validar();
    if (err) { setMensaje("❌ " + err); return; }

    const { error } = await supabase
      .from("inspecciones_equipaje")
      .update({
        id_embarque: parseInt(idEmbarque, 10),
        tipo_equipaje: tipoEquipaje,
        numero_vuelo: numeroVuelo.trim(),
        resultado,
        observaciones: observaciones.trim() || null,
        evidencia_url: evidenciaUrl.trim() || null,
        operador_id: operadorId ? parseInt(operadorId, 10) : null,
        id_maleta: idMaleta ? parseInt(idMaleta, 10) : null,
      })
      .eq("id_inspeccion", seleccionId);

    if (error) { setMensaje("❌ Error al modificar: " + error.message); return; }

    setMensaje("✅ Cambios guardados.");
    await cargarInspecciones();
    limpiar();
  };

  const eliminar = async () => {
    setMensaje("");
    if (seleccionId === null) { setMensaje("❌ No hay inspección seleccionada."); return; }
    if (!window.confirm("¿Eliminar esta inspección?")) return;

    const { error } = await supabase.from("inspecciones_equipaje").delete().eq("id_inspeccion", seleccionId);
    if (error) { setMensaje("❌ Error al eliminar: " + error.message); return; }

    setMensaje("🗑️ Inspección eliminada.");
    await cargarInspecciones();
    limpiar();
  };

  const inspeccionesFiltradas = inspecciones.filter((r) =>
    (!filtro.resultado || r.resultado === filtro.resultado) &&
    (!filtro.vuelo || r.numero_vuelo.toLowerCase().includes(filtro.vuelo.toLowerCase())) &&
    (!filtro.embarque || String(r.id_embarque) === filtro.embarque) &&
    (!filtro.tipo || r.tipo_equipaje === filtro.tipo)
  );

  return (
    <>
      <div className="emg-title-wrap"><h1 className="emg-title">Inspección de Equipaje (RX / General)</h1></div>

      <div className="emg-grid">
        {/* Formulario */}
        <form className="emg-card emg-form" onSubmit={(e)=>{ e.preventDefault(); registrar(); }}>
          <h2 className="emg-subtitle">Datos de Inspección</h2>

          <label>
            <span className="emg-label">Embarque</span>
            <select className="emg-input" value={idEmbarque} onChange={(e)=>setIdEmbarque(e.target.value)}>
              <option value="">Seleccione</option>
              {embarques.map(e => (
                <option key={e.id_embarque} value={e.id_embarque}>{txtEmbarque(e)}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="emg-label">Tipo de equipaje</span>
            <select className="emg-input" value={tipoEquipaje} onChange={(e)=>setTipoEquipaje(e.target.value as any)}>
              <option value="mano">mano</option>
              <option value="facturado">facturado</option>
              <option value="especial">especial</option>
            </select>
          </label>

          <label>
            <span className="emg-label">Número de vuelo</span>
            <input className="emg-input" value={numeroVuelo} onChange={(e)=>setNumeroVuelo(e.target.value)} placeholder="Ej: AA1234" />
          </label>

          <label>
            <span className="emg-label">Resultado</span>
            <select className="emg-input" value={resultado} onChange={(e)=>setResultado(e.target.value as any)}>
              <option value="limpio">limpio</option>
              <option value="retener">retener</option>
            </select>
          </label>

          <label>
            <span className="emg-label">Operador</span>
            <select className="emg-input" value={operadorId} onChange={(e)=>setOperadorId(e.target.value)}>
              <option value="">Seleccione</option>
              {operadores.map(o => <option key={o.id_personal} value={o.id_personal}>{o.nombre}</option>)}
            </select>
          </label>

          {tipoEquipaje === "facturado" && (
            <label>
              <span className="emg-label">ID de maleta (requerido en facturado)</span>
              <input className="emg-input" value={idMaleta} onChange={(e)=>setIdMaleta(e.target.value)} placeholder="Ej: 1024" />
            </label>
          )}

          <label className="emg-col2">
            <span className="emg-label">Objetos detectados (si retener)</span>
            <div className="rx-chips">
              {objetos.map(o => (
                <label key={o.codigo} className="rx-chip">
                  <input
                    type="checkbox"
                    checked={objetosDetectados.includes(o.codigo)}
                    onChange={(e)=>{
                      const checked = e.target.checked;
                      setObjetosDetectados(prev => checked ? [...prev, o.codigo] : prev.filter(x=>x!==o.codigo));
                    }}
                  />
                  <span>{o.nombre}</span>
                </label>
              ))}
            </div>
          </label>

          {objetosDetectados.includes("otro") && (
            <label className="emg-col2">
              <span className="emg-label">Detalle de “Otro”</span>
              <input className="emg-input" value={otroDetalle} onChange={(e)=>setOtroDetalle(e.target.value)} />
            </label>
          )}

          <label className="emg-col2">
            <span className="emg-label">Observaciones</span>
            <textarea className="emg-input" rows={3} value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} />
          </label>

          <label className="emg-col2">
            <span className="emg-label">URL de evidencia (opcional)</span>
            <input className="emg-input" value={evidenciaUrl} onChange={(e)=>setEvidenciaUrl(e.target.value)} placeholder="https://..." />
          </label>

          {/* ====== Imagen RX con marcación ====== */}
          <div className="emg-col2">
            <span className="emg-label">Vista RX (click para marcar)</span>
            <div className="rx-image-wrap rx-markable">
              <img
                ref={imgRef}
                src={xrSrc}
                alt="Imagen RX de equipaje"
                className="rx-image"
                onClick={onClickImagen}
              />
              {/* Puntos renderizados */}
              {imgRef.current && marcadores.map((m, idx) => (
                <span
                  key={idx}
                  className="rx-marker"
                  style={{
                    left: `calc(${m.x_pct}% - 6px)`,
                    top:  `calc(${m.y_pct}% - 6px)`
                  }}
                  title={m.nota ? `Punto ${idx+1}: ${m.nota}` : `Punto ${idx+1}`}
                >
                  {idx+1}
                </span>
              ))}
            </div>

            {/* Nota para el próximo punto (opcional) */}
            <div className="rx-note-row">
              <input
                className="emg-input"
                value={notaActual}
                onChange={(e)=>setNotaActual(e.target.value)}
                placeholder="Nota para el próximo punto (opcional)"
              />
              <div className="rx-note-actions">
                <button type="button" className="emg-btn emg-btn-secondary" onClick={quitarUltimoPunto}>Quitar último</button>
                <button type="button" className="emg-btn emg-btn-ghost" onClick={limpiarPuntos}>Limpiar puntos</button>
              </div>
            </div>
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
          <h2 className="emg-subtitle">Historial de Inspecciones</h2>

          <div className="emg-filters">
            <select className="emg-input" value={filtro.embarque} onChange={(e)=>setFiltro(prev=>({...prev, embarque: e.target.value}))}>
              <option value="">Embarque</option>
              {embarques.map(e => <option key={e.id_embarque} value={e.id_embarque}>#{e.id_embarque}</option>)}
            </select>
            <select className="emg-input" value={filtro.tipo} onChange={(e)=>setFiltro(prev=>({...prev, tipo: e.target.value}))}>
              <option value="">Tipo</option>
              <option value="mano">mano</option>
              <option value="facturado">facturado</option>
              <option value="especial">especial</option>
            </select>
            <select className="emg-input" value={filtro.resultado} onChange={(e)=>setFiltro(prev=>({...prev, resultado: e.target.value}))}>
              <option value="">Resultado</option>
              <option value="limpio">limpio</option>
              <option value="retener">retener</option>
            </select>
            <input className="emg-input" placeholder="Vuelo..." value={filtro.vuelo} onChange={(e)=>setFiltro(prev=>({...prev, vuelo: e.target.value}))} />
          </div>

          <div className="emg-table-wrap">
            <table className="emg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Embarque</th>
                  <th>Tipo</th>
                  <th>Vuelo</th>
                  <th>Resultado</th>
                  <th>Operador</th>
                  <th>Maleta</th>
                  <th>Fecha/Hora</th>
                </tr>
              </thead>
              <tbody>
                {inspeccionesFiltradas.map(r => (
                  <tr
                    key={r.id_inspeccion}
                    className={r.id_inspeccion === seleccionId ? "emg-row-selected" : ""}
                    onClick={()=> seleccionarFila(r)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{r.id_inspeccion}</td>
                    <td>{r.embarque_txt}</td>
                    <td>{r.tipo_equipaje}</td>
                    <td>{r.numero_vuelo}</td>
                    <td>{r.resultado}</td>
                    <td>{r.operador_txt}</td>
                    <td>{r.id_maleta ?? "—"}</td>
                    <td>{r.fecha_hora?.replace("T"," ").slice(0,16)}</td>
                  </tr>
                ))}
                {inspeccionesFiltradas.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 12 }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
