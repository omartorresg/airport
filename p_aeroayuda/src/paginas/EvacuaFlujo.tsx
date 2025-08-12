import React, { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/evacuaFlujo.css";


type Zona = { id_zona: number; nombre_zona: string };
type Tipo = { id_tipo_emergencia: number; nombre: string };
type Nivel = { id_nivel: number; nombre: string };

type Emergencia = {
  id_emergencia: number;
  id_tipo: number;
  id_nivel: number;
  id_zona: number | null;
  descripcion: string | null;
  fecha_hora: string;
  coordenada_x: number | null;
  coordenada_y: number | null;
  tipo_nombre?: string;
  nivel_nombre?: string;
  zona_nombre?: string | null;
};

type RutaEvacuacionRow = {
  id_ruta: number;
  id_emergencia: number;
  id_zona: number;
  nombre_ruta: string | null;
  estado_ruta: "abierta" | "cerrada";
  // decorado para la vista
  emergencia_txt?: string;
  zona_txt?: string;
};

export default function EvacuacionFlujo() {
  // catálogos
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);

  // formulario
  const [idEmergencia, setIdEmergencia] = useState<string>("");
  const [idZona, setIdZona] = useState<string>("");
  const [nombreRuta, setNombreRuta] = useState<string>("");
  const [estadoRuta, setEstadoRuta] = useState<"abierta" | "cerrada">("abierta");

  const [mensaje, setMensaje] = useState<string>("");

  // listado
  const [rutas, setRutas] = useState<RutaEvacuacionRow[]>([]);
  const [seleccionIdRuta, setSeleccionIdRuta] = useState<number | null>(null);

  // filtros
  const [filtro, setFiltro] = useState<{ estado: string; zona: string; emergencia: string }>({
    estado: "",
    zona: "",
    emergencia: "",
  });

  useEffect(() => {
    const cargar = async () => {
      // zonas
      const { data: z } = await supabase.from("zonas").select("id_zona,nombre_zona").order("nombre_zona");
      setZonas(z || []);

      // tipos & niveles (para describir emergencias)
      const { data: t } = await supabase.from("tipos_emergencia").select("id_tipo_emergencia,nombre").order("nombre");
      setTipos(t || []);
      const { data: n } = await supabase.from("niveles_severidad").select("id_nivel,nombre").order("nombre");
      setNiveles(n || []);

      // emergencias (con zona)
      const { data: e } = await supabase
        .from("emergencias")
        .select("id_emergencia,id_tipo,id_nivel,id_zona,descripcion,fecha_hora,coordenada_x,coordenada_y")
        .order("id_emergencia", { ascending: false });
      const emg = (e || []).map((row: any): Emergencia => ({
        ...row,
        tipo_nombre: t?.find((x) => x.id_tipo_emergencia === row.id_tipo)?.nombre,
        nivel_nombre: n?.find((x) => x.id_nivel === row.id_nivel)?.nombre,
        zona_nombre: (z || []).find((zz) => zz.id_zona === row.id_zona)?.nombre_zona || null,
      }));
      setEmergencias(emg);

      await cargarRutas(emg, z || []);
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarRutas = async (emgOpt?: Emergencia[], zonasOpt?: Zona[]) => {
    const { data: r } = await supabase
      .from("rutas_evacuacion")
      .select("id_ruta,id_emergencia,id_zona,nombre_ruta,estado_ruta")
      .order("id_ruta", { ascending: false });

    const emg = emgOpt ?? emergencias;
    const zs = zonasOpt ?? zonas;

    const decoradas: RutaEvacuacionRow[] = (r || []).map((row: any) => {
      const e = emg.find((x) => x.id_emergencia === row.id_emergencia);
      const z = zs.find((x) => x.id_zona === row.id_zona);
      const fecha = e?.fecha_hora ? e.fecha_hora.replace("T", " ").slice(0, 16) : "";
      return {
        ...row,
        emergencia_txt: e ? `#${e.id_emergencia} · ${e.tipo_nombre} · ${e.nivel_nombre} · ${fecha}` : `#${row.id_emergencia}`,
        zona_txt: z?.nombre_zona || "",
      };
    });

    setRutas(decoradas);
  };

  // helpers
  const limpiar = () => {
    setIdEmergencia("");
    setIdZona("");
    setNombreRuta("");
    setEstadoRuta("abierta");
    setSeleccionIdRuta(null);
    setMensaje("");
  };

  const validar = () => {
  if (!idEmergencia || !idZona) return "Selecciona emergencia y zona.";
  if (!nombreRuta || nombreRuta.trim().length < 3) 
    return "El nombre de la ruta es obligatorio y debe tener al menos 3 caracteres.";
  return "";
};


  // CRUD
  const registrar = async () => {
    setMensaje("");
    if (seleccionIdRuta !== null) {
      setMensaje("❌ Estás editando. Usa “Modificar” o limpia el formulario.");
      return;
    }
    const err = validar();
    if (err) { setMensaje("❌ " + err); return; }

    const { error } = await supabase.from("rutas_evacuacion").insert({
      id_emergencia: parseInt(idEmergencia, 10),
      id_zona: parseInt(idZona, 10),
      nombre_ruta: nombreRuta || null,
      estado_ruta: estadoRuta,
    });
    if (error) { setMensaje("❌ Error al registrar: " + error.message); return; }

    setMensaje("✅ Ruta registrada.");
    await cargarRutas();
    limpiar();
  };

  const seleccionarFila = (r: RutaEvacuacionRow) => {
    setSeleccionIdRuta(r.id_ruta);
    setIdEmergencia(String(r.id_emergencia));
    setIdZona(String(r.id_zona));
    setNombreRuta(r.nombre_ruta || "");
    setEstadoRuta(r.estado_ruta);
    setMensaje("ℹ️ Modo edición.");
  };

  const modificar = async () => {
    setMensaje("");
    if (seleccionIdRuta === null) { setMensaje("❌ No hay ruta seleccionada."); return; }
    const err = validar();
    if (err) { setMensaje("❌ " + err); return; }

    const { error } = await supabase
      .from("rutas_evacuacion")
      .update({
        id_emergencia: parseInt(idEmergencia, 10),
        id_zona: parseInt(idZona, 10),
        nombre_ruta: nombreRuta || null,
        estado_ruta: estadoRuta,
      })
      .eq("id_ruta", seleccionIdRuta);

    if (error) { setMensaje("❌ Error al modificar: " + error.message); return; }

    setMensaje("✅ Cambios guardados.");
    await cargarRutas();
    limpiar();
  };

  const eliminar = async () => {
    setMensaje("");
    if (seleccionIdRuta === null) { setMensaje("❌ No hay ruta seleccionada."); return; }
    if (!window.confirm("¿Eliminar esta ruta de evacuación?")) return;

    const { error } = await supabase.from("rutas_evacuacion").delete().eq("id_ruta", seleccionIdRuta);
    if (error) { setMensaje("❌ Error al eliminar: " + error.message); return; }

    setMensaje("🗑️ Ruta eliminada.");
    await cargarRutas();
    limpiar();
  };

  const toggleEstado = async (r: RutaEvacuacionRow) => {
    const nuevo = r.estado_ruta === "abierta" ? "cerrada" : "abierta";
    const { error } = await supabase.from("rutas_evacuacion").update({ estado_ruta: nuevo }).eq("id_ruta", r.id_ruta);
    if (error) { setMensaje("❌ Error al cambiar estado: " + error.message); return; }
    await cargarRutas();
  };

  // filtros en memoria
  const rutasFiltradas = rutas.filter((r) =>
    (!filtro.estado || r.estado_ruta === filtro.estado) &&
    (!filtro.zona || String(r.id_zona) === filtro.zona) &&
    (!filtro.emergencia || String(r.id_emergencia) === filtro.emergencia)
  );

  return (
    <>
      <div className="evc-title-wrap"><h1 className="evc-title">Evacuación y Control de Flujo</h1></div>

      <div className="evc-grid">
        {/* Panel Formulario */}
        <form
          className="evc-card evc-form"
          onSubmit={(e) => { e.preventDefault(); registrar(); }}
        >
          <h2 className="evc-subtitle">Gestión de Rutas</h2>

          <label>
            <span className="evc-label">Emergencia</span>
            <select className="evc-input" value={idEmergencia} onChange={(e) => setIdEmergencia(e.target.value)}>
              <option value="">Seleccione</option>
              {emergencias.map((emg) => {
                const fecha = emg.fecha_hora?.replace("T", " ").slice(0, 16);
                return (
                  <option key={emg.id_emergencia} value={emg.id_emergencia}>
                    #{emg.id_emergencia} · {emg.tipo_nombre} · {emg.nivel_nombre} · {fecha}
                    {emg.zona_nombre ? ` · ${emg.zona_nombre}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <span className="evc-label">Zona</span>
            <select className="evc-input" value={idZona} onChange={(e) => setIdZona(e.target.value)}>
              <option value="">Seleccione</option>
              {zonas.map((z) => (
                <option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>
              ))}
            </select>
          </label>

          <label className="evc-col2">
            <span className="evc-label">Nombre de la Ruta</span>
            <input
  className="evc-input"
  value={nombreRuta}
  onChange={(e) => setNombreRuta(e.target.value)}
  placeholder="Ej: Corredor Norte A → Punto Seguro 3"
  required
/>

          </label>

          <label>
            <span className="evc-label">Estado</span>
            <select className="evc-input" value={estadoRuta} onChange={(e) => setEstadoRuta(e.target.value as any)}>
              <option value="abierta">abierta</option>
              <option value="cerrada">cerrada</option>
            </select>
          </label>

          <div className="evc-actions">
            <button type="button" className="evc-btn evc-btn-primary" onClick={registrar}>Registrar</button>
            <button type="button" className="evc-btn evc-btn-secondary" onClick={modificar}>Modificar</button>
            <button type="button" className="evc-btn evc-btn-danger" onClick={eliminar}>Eliminar</button>
            <button type="button" className="evc-btn evc-btn-ghost" onClick={limpiar}>Limpiar</button>
          </div>

          {mensaje && <div className="evc-msg">{mensaje}</div>}
        </form>

        {/* Panel Consulta */}
        <div className="evc-card evc-consulta">
          <h2 className="evc-subtitle">Rutas / Estado</h2>

          <div className="evc-filters">
            <select className="evc-input" value={filtro.emergencia} onChange={(e) => setFiltro(prev => ({ ...prev, emergencia: e.target.value }))}>
              <option value="">Emergencia</option>
              {emergencias.map(emg => (
                <option key={emg.id_emergencia} value={emg.id_emergencia}>
                  #{emg.id_emergencia} · {emg.tipo_nombre} · {emg.nivel_nombre}
                </option>
              ))}
            </select>

            <select className="evc-input" value={filtro.zona} onChange={(e) => setFiltro(prev => ({ ...prev, zona: e.target.value }))}>
              <option value="">Zona</option>
              {zonas.map(z => <option key={z.id_zona} value={z.id_zona}>{z.nombre_zona}</option>)}
            </select>

            <select className="evc-input" value={filtro.estado} onChange={(e) => setFiltro(prev => ({ ...prev, estado: e.target.value }))}>
              <option value="">Estado</option>
              <option value="abierta">abierta</option>
              <option value="cerrada">cerrada</option>
            </select>
          </div>

          <div className="evc-table-wrap">
            <table className="evc-table">
              <thead>
                <tr>
                  <th>ID Ruta</th>
                  <th>Emergencia</th>
                  <th>Zona</th>
                  <th>Nombre Ruta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutasFiltradas.map((r) => (
                  <tr
                    key={r.id_ruta}
                    className={r.id_ruta === seleccionIdRuta ? "evc-row-selected" : ""}
                    onClick={() => seleccionarFila(r)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{r.id_ruta}</td>
                    <td>{r.emergencia_txt}</td>
                    <td>{r.zona_txt}</td>
                    <td>{r.nombre_ruta || "—"}</td>
                    <td>{r.estado_ruta}</td>
                    <td>
                      <button
                        type="button"
                        className="evc-chip"
                        onClick={(e) => { e.stopPropagation(); toggleEstado(r); }}
                        title={r.estado_ruta === "abierta" ? "Cerrar ruta" : "Abrir ruta"}
                      >
                        {r.estado_ruta === "abierta" ? "Cerrar" : "Abrir"}
                      </button>
                    </td>
                  </tr>
                ))}
                {rutasFiltradas.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 12 }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
