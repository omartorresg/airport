import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/TableroVuelos.css";

/**
 * Vista usada para llegadas:
 * public.llegadas_con_correa_ext
 */

type Vuelo = {
  id_vuelo: number;
  origen: string | null;
  destino: string | null;
  hora_abordaje?: string | null;
  fecha_hora_salida: string | null;
  fecha_hora_llegada?: string | null;
  estado: string | null;
};

type LlegadaRow = {
  id_vuelo: number;
  origen: string | null;
  destino: string | null;
  fecha_hora_salida?: string | null;
  fecha_hora_llegada?: string | null;
  estado?: string | null;
  correa?: string | null;
};

type CorreaResumen = {
  id_asignacion: number;
  id_vuelo: number;
  correa: string | null;
  ubicacion: string | null;
  estado_correa: "asignada" | "en_uso" | "finalizada" | string;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export default function TableroVuelos() {
  const [salidas, setSalidas] = useState<Vuelo[]>([]);
  const [llegadas, setLlegadas] = useState<LlegadaRow[]>([]);
  const [correasResumen, setCorreasResumen] = useState<CorreaResumen[]>([]);
  const [loading, setLoading] = useState(true);

  // Ventana (-12h, +36h) para SALIDAS
  const { fromISO, toISO } = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 36 * 60 * 60 * 1000);
    return { fromISO: from.toISOString(), toISO: to.toISOString() };
  }, []);

  const formatearHora = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Valida que origen/destino estén presentes y no vacíos/espacios
  const tieneOrigenDestino = (o?: string | null, d?: string | null) =>
    !!(o && d && o.trim().length > 0 && d.trim().length > 0);

  // Chip de SALIDAS
  const chipEstadoSalidas = (estado?: string | null) => {
    const e = (estado ?? "").toLowerCase();
    const map: Record<string, string> = {
      programado: "chip chip--programado",
      "en horario": "chip chip--enhorario",
      abordando: "chip chip--abordando",
      embarcando: "chip chip--abordando",
      retrasado: "chip chip--retrasado",
      demorado: "chip chip--retrasado",
      cancelado: "chip chip--cancelado",
      salido: "chip chip--salido",
      "en ruta": "chip chip--salido",
    };
    return map[e] || "chip chip--programado";
  };

  // Estado para LLEGADAS
  function estadoParaLlegadas(v: {
    fecha_hora_salida?: string | null;
    fecha_hora_llegada?: string | null;
    estado?: string | null;
  }) {
    const now = new Date();
    const salida = v.fecha_hora_salida ? new Date(v.fecha_hora_salida) : null;
    const llegada = v.fecha_hora_llegada ? new Date(v.fecha_hora_llegada) : null;
    const e = (v.estado ?? "").toLowerCase();

    if (e === "cancelado") return { label: "Cancelado", cls: "chip chip--cancelado" };
    if (e === "retrasado") return { label: "Retrasado", cls: "chip chip--retrasado" };
    if (llegada && now >= llegada) return { label: "Arribado", cls: "chip chip--arribado" };
    if (salida && llegada && now >= salida && now < llegada)
      return { label: "En ruta", cls: "chip chip--salido" };
    if (salida && now < salida) return { label: "En horario", cls: "chip chip--enhorario" };
    if (e === "en horario" || e === "programado")
      return { label: "En horario", cls: "chip chip--enhorario" };

    return { label: v.estado ?? "En horario", cls: "chip chip--enhorario" };
  }

  const cargarDatos = async () => {
    setLoading(true);

    // ================= SALIDAS =================
    const { data: sal, error: errSal } = await supabase
      .from("vuelo")
      .select("id_vuelo, origen, destino, hora_abordaje, fecha_hora_salida, estado")
      .gte("fecha_hora_salida", fromISO)
      .lte("fecha_hora_salida", toISO)
      // ---- filtros para NO traer registros sin origen/destino
      .not("origen", "is", null)
      .not("destino", "is", null)
      .neq("origen", "")
      .neq("destino", "")
      .order("fecha_hora_salida", { ascending: true });

    if (errSal) console.error("Error salidas:", errSal);

    // filtro defensivo extra (por si vienen espacios)
    const salidasFiltradas = ((sal as Vuelo[]) ?? []).filter(v =>
      tieneOrigenDestino(v.origen, v.destino)
    );
    setSalidas(salidasFiltradas);

    // ================= LLEGADAS (vista) =================
    const { data: lle, error: errLle } = await supabase
      .from("llegadas_con_correa_ext")
      .select(
        "id_vuelo, origen, destino, fecha_hora_salida, fecha_hora_llegada, estado, correa"
      )
      // ---- filtros para NO traer registros sin origen/destino
      .not("origen", "is", null)
      .not("destino", "is", null)
      .neq("origen", "")
      .neq("destino", "")
      .order("fecha_hora_llegada", { ascending: true, nullsFirst: false });

    if (errLle) console.error("Error llegadas:", errLle);

    const llegadasFiltradas = ((lle as LlegadaRow[]) ?? []).filter(v =>
      tieneOrigenDestino(v.origen, v.destino)
    );
    setLlegadas(llegadasFiltradas);

    // ================= CORREAS =================
    const { data: corr, error: errCorr } = await supabase
      .from("tablero_correas")
      .select(
        "id_asignacion, id_vuelo, correa, ubicacion, estado_correa, hora_inicio, hora_fin"
      );

    if (errCorr) console.error("Error correas:", errCorr);

    setCorreasResumen(
      ((corr as CorreaResumen[]) ?? []).filter(
        x => x.estado_correa === "asignada" || x.estado_correa === "en_uso"
      )
    );

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromISO, toISO]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("tablero-vuelos")
      .on("postgres_changes", { event: "*", schema: "public", table: "vuelo" }, () => cargarDatos())
      .on("postgres_changes", { event: "*", schema: "public", table: "asignacion_correa" }, () =>
        cargarDatos()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tablero-container">
      <header className="tablero-hero">
        <div className="tablero-hero-inner">
          <h1 className="tablero-title">Tablero de Vuelos</h1>
          <p className="tablero-subtitle">Salidas, llegadas y correas de equipaje</p>
        </div>
      </header>

      {loading ? (
        <div className="tablero-card">Cargando tablero…</div>
      ) : (
        <div className="tablero-grid">
          {/* SALIDAS */}
          <section className="tablero-card">
            <div className="tablero-card-header">
              <h2>Salidas de Hoy</h2>
            </div>
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Abordaje</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {salidas.map((v) => (
                    <tr key={`S-${v.id_vuelo}`}>
                      <td>{formatearHora(v.fecha_hora_salida)}</td>
                      <td>{v.origen}</td>
                      <td>{v.destino}</td>
                      <td>{v.hora_abordaje ?? "—"}</td>
                      <td>
                        <span className={chipEstadoSalidas(v.estado)}>
                          {v.estado ?? "Programado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {salidas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="vacio">
                        Sin salidas con origen/destino válidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* LLEGADAS */}
          <section className="tablero-card">
            <div className="tablero-card-header">
              <h2>Llegadas de Hoy</h2>
            </div>
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Correa</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {llegadas.map((v) => {
                    const st = estadoParaLlegadas(v);
                    return (
                      <tr key={`L-${v.id_vuelo}`}>
                        <td>{formatearHora(v.fecha_hora_llegada)}</td>
                        <td>{v.origen}</td>
                        <td>{v.destino}</td>
                        <td>
                          {v.correa ? (
                            <span className="badge-correa">{v.correa}</span>
                          ) : (
                            <span className="badge-correa badge-correa--none">—</span>
                          )}
                        </td>
                        <td>
                          <span className={st.cls}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {llegadas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="vacio">
                        Sin llegadas con origen/destino válidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* RESUMEN DE CORREAS */}
          <section className="tablero-card">
            <div className="tablero-card-header">
              <h2>Correas en uso</h2>
            </div>
            <div className="correas-grid">
              {correasResumen.map((c) => (
                <div key={c.id_asignacion} className="correa-item">
                  <div className="correa-codigo">{c.correa ?? "—"}</div>
                  <div className="correa-detalle">
                    <div className="correa-ubic">{c.ubicacion ?? "Ubicación general"}</div>
                    <div className={`correa-estado correa-estado--${c.estado_correa}`}>
                      {c.estado_correa === "en_uso" ? "En uso" : "Asignada"}
                    </div>
                  </div>
                </div>
              ))}
              {correasResumen.length === 0 && (
                <div className="vacio">No hay correas asignadas actualmente.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
