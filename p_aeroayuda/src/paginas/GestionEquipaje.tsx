import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/Gestion_Equipaje.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** ===== Tipos ===== */
type Equipaje = {
  id_equipaje: number;
  id_pasajero: number;
  id_ticket: number;
  estado: string | null;
  cantidad: number | null;
  peso_total: number | null;
  usuario_facturo: string | null;
};

type MomentoCompra = "web" | "checkin" | "abordaje";

type Maleta = {
  id_maleta: number;
  id_equipaje: number;
  tipo: "mano" | "bodega" | "especial";
  peso: number;
  estado: string | null;
  /** Persistido en BD */
  momento_compra: MomentoCompra;
};

type Props = {
  idPersona: number;
  idTicket: number;
  usuarioActual?: string;
  readOnly?: boolean;
};

type TarifaConfig = {
  momento: MomentoCompra;
  tarifa_segunda: number;
  tarifa_sobrepeso: number;
  tarifa_especial: number;
  limite_kg_sin_cargo: number;
  peso_max_por_maleta: number;
};

/** ===== Config por momento (puedes mover a tabla si quieres) ===== */
const DEFAULTS: Record<MomentoCompra, TarifaConfig> = {
  checkin: {
    momento: "checkin",
    tarifa_segunda: 30,
    tarifa_sobrepeso: 50,
    tarifa_especial: 100,
    limite_kg_sin_cargo: 23,
    peso_max_por_maleta: 25,
  },
  abordaje: {
    momento: "abordaje",
    tarifa_segunda: 40,
    tarifa_sobrepeso: 70,
    tarifa_especial: 120,
    limite_kg_sin_cargo: 23,
    peso_max_por_maleta: 25,
  },
  web: {
    momento: "web",
    tarifa_segunda: 25,
    tarifa_sobrepeso: 40,
    tarifa_especial: 90,
    limite_kg_sin_cargo: 23,
    peso_max_por_maleta: 25,
  },
};

/** ===== Cálculo de tarifas por pieza según SU momento =====
 * Regla global: 1ª maleta gratis (sin importar el momento); desde la 2ª,
 * usar la tarifa_segunda del momento de ESA maleta. Sobrepeso y especial también por pieza.
 */
function calcularTarifasPorPieza(maletas: Maleta[], cfgMap: Record<MomentoCompra, TarifaConfig>) {
  const lineas: { concepto: string; monto: number }[] = [];
  let total = 0;

  const ordenadas = [...maletas].sort((a, b) => (a.id_maleta ?? 0) - (b.id_maleta ?? 0));

  ordenadas.forEach((m, idx) => {
    const num = idx + 1;
    const cfg = cfgMap[m.momento_compra];

    // (1) Pieza
    if (idx === 0) {
      lineas.push({ concepto: `Maleta ${num} (gratis) — ${m.momento_compra}`, monto: 0 });
    } else {
      lineas.push({ concepto: `Maleta ${num} — ${m.momento_compra}`, monto: cfg.tarifa_segunda });
      total += cfg.tarifa_segunda;
    }

    // (2) Especial
    if (m.tipo === "especial") {
      lineas.push({ concepto: `Maleta ${num} - especial — ${m.momento_compra}`, monto: cfg.tarifa_especial });
      total += cfg.tarifa_especial;
    }

    // (3) Sobrepeso
    if (m.peso > cfg.limite_kg_sin_cargo) {
      lineas.push({
        concepto: `Maleta ${num} - sobrepeso (> ${cfg.limite_kg_sin_cargo} kg) — ${m.momento_compra}`,
        monto: cfg.tarifa_sobrepeso,
      });
      total += cfg.tarifa_sobrepeso;
    }
  });

  return { lineas, total };
}

/** Agrupa para resumen por momento */
function resumirPorMomento(maletas: Maleta[]) {
  return maletas.reduce<Record<MomentoCompra, { cantidad: number; peso: number }>>(
    (acc, m) => {
      const key = m.momento_compra;
      acc[key].cantidad += 1;
      acc[key].peso += Number(m.peso ?? 0);
      return acc;
    },
    {
      web: { cantidad: 0, peso: 0 },
      checkin: { cantidad: 0, peso: 0 },
      abordaje: { cantidad: 0, peso: 0 },
    }
  );
}

export default function GestionEquipaje({
  idPersona,
  idTicket,
  usuarioActual,
  readOnly = false,
}: Props) {
  const [equipaje, setEquipaje] = useState<Equipaje | null>(null);
  const [maletas, setMaletas] = useState<Maleta[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Config activa (puedes reemplazar por lectura desde BD si ya la tienes)
  const cfgMap = DEFAULTS;

  // Form para nueva maleta
  const [form, setForm] = useState<{
    tipo: "mano" | "bodega" | "especial";
    peso: string;
    momento_compra: MomentoCompra;
  }>({
    tipo: "bodega",
    peso: "",
    /** WEB = compra del vuelo */
    momento_compra: "web",
  });

  /** Puede facturar: al menos 1 maleta y ninguna excede su máximo por pieza (según su momento) */
  const puedeFacturar = useMemo(() => {
    if (!equipaje) return false;
    const cant = equipaje.cantidad ?? 0;
    const estado = (equipaje.estado ?? "").toLowerCase();
    const sinExcesos = maletas.every((m) => m.peso <= cfgMap[m.momento_compra].peso_max_por_maleta);
    return cant > 0 && estado !== "facturado" && sinExcesos;
  }, [equipaje, maletas]);

  const yaFacturado = useMemo(
    () => (equipaje?.estado ?? "").toLowerCase() === "facturado",
    [equipaje]
  );

  /** Carga/crea encabezado equipaje por (idPersona, idTicket) */
  const getOrCreateEquipaje = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let { data: eq, error: e1 } = await supabase
        .from("equipaje")
        .select("*")
        .eq("id_pasajero", idPersona)
        .eq("id_ticket", idTicket)
        .maybeSingle<Equipaje>();

      if (e1 && e1.code !== "PGRST116") throw e1;

      if (!eq) {
        const { data: inserted, error: e2 } = await supabase
          .from("equipaje")
          .upsert(
            {
              id_pasajero: idPersona,
              id_ticket: idTicket,
              estado: "registrado",
              cantidad: 0,
              peso_total: 0,
              usuario_facturo: null,
            },
            { onConflict: "id_pasajero,id_ticket" }
          )
          .select("*")
          .single<Equipaje>();
        if (e2) throw e2;
        eq = inserted;
      }

      setEquipaje(eq);

      // Trae cada maleta con su momento_compra PERSISTIDO
      const { data: mList, error: e3 } = await supabase
        .from("maleta")
        .select("id_maleta,id_equipaje,tipo,peso,estado,momento_compra")
        .eq("id_equipaje", eq.id_equipaje)
        .order("id_maleta", { ascending: true });

      if (e3) throw e3;

      // Normaliza a uno de los 3 valores válidos (por si hay nulos)
      const normalizadas: Maleta[] = (mList ?? []).map((m: any) => ({
        id_maleta: m.id_maleta,
        id_equipaje: m.id_equipaje,
        tipo: m.tipo,
        peso: Number(m.peso ?? 0),
        estado: m.estado ?? "registrada",
        momento_compra:
          (["web", "checkin", "abordaje"].includes(String(m.momento_compra)) ? m.momento_compra : "checkin") as MomentoCompra,
      }));

      setMaletas(normalizadas);

      // (Re)calcula y persiste cantidad y peso_total (por si vinieron nulos)
      const cant = normalizadas.length;
      const pesoTot = normalizadas.reduce((s, mm) => s + Number(mm.peso ?? 0), 0);
      if (cant !== (eq.cantidad ?? 0) || pesoTot !== Number(eq.peso_total ?? 0)) {
        await supabase
          .from("equipaje")
          .update({ cantidad: cant, peso_total: pesoTot })
          .eq("id_equipaje", eq.id_equipaje);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al cargar equipaje.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idPersona && idTicket) getOrCreateEquipaje();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPersona, idTicket]);

  /** Insertar maleta con momento_compra (PERSISTE en BD) */
  const agregarMaleta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipaje || readOnly) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const peso = Number(form.peso);
      if (Number.isNaN(peso) || peso <= 0) {
        setErrorMsg("El peso debe ser un número mayor que 0.");
        setSaving(false);
        return;
      }

      // Valida contra el máximo del momento elegido para ESTA maleta
      const max = cfgMap[form.momento_compra].peso_max_por_maleta;
      if (peso > max) {
        setErrorMsg(`El peso máximo para '${form.momento_compra}' es ${max} kg.`);
        setSaving(false);
        return;
      }

      // Inserta con momento_compra para que se mantenga en BD
      const { error } = await supabase.from("maleta").insert({
        id_equipaje: equipaje.id_equipaje,
        tipo: form.tipo,
        peso,
        estado: "registrada",
        momento_compra: form.momento_compra,
      });

      if (error) throw error;

      // Recalcula y actualiza totales en encabezado
      const { data: mList } = await supabase
        .from("maleta")
        .select("peso")
        .eq("id_equipaje", equipaje.id_equipaje);

      const cant = (mList?.length ?? 0);
      const pesoTot = (mList ?? []).reduce((s, m: any) => s + Number(m.peso ?? 0), 0);

      await supabase
        .from("equipaje")
        .update({ cantidad: cant, peso_total: pesoTot })
        .eq("id_equipaje", equipaje.id_equipaje);

      await getOrCreateEquipaje();
      setForm({ tipo: "bodega", peso: "", momento_compra: form.momento_compra });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.message?.includes("column \"momento_compra\"")
          ? "Falta la columna 'momento_compra' en la tabla MAL`ETA. Agrega la columna para poder guardar el momento."
          : err?.message ?? "Error al agregar maleta."
      );
    } finally {
      setSaving(false);
    }
  };

  /** Eliminar maleta */
  const eliminarMaleta = async (id_maleta: number) => {
    if (!equipaje || readOnly) return;
    if (!window.confirm("¿Eliminar esta maleta?")) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from("maleta").delete().eq("id_maleta", id_maleta);
      if (error) throw error;

      const { data: mList } = await supabase
        .from("maleta")
        .select("peso")
        .eq("id_equipaje", equipaje.id_equipaje);

      const cant = (mList?.length ?? 0);
      const pesoTot = (mList ?? []).reduce((s, m: any) => s + Number(m.peso ?? 0), 0);

      await supabase
        .from("equipaje")
        .update({ cantidad: cant, peso_total: pesoTot })
        .eq("id_equipaje", equipaje.id_equipaje);

      await getOrCreateEquipaje();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al eliminar maleta.");
    } finally {
      setSaving(false);
    }
  };

  /** Facturar */
  const facturar = async () => {
    if (!equipaje || readOnly) return;
    setFacturando(true);
    setErrorMsg(null);
    try {
      if ((equipaje.cantidad ?? 0) <= 0) {
        setErrorMsg("Debes tener al menos 1 maleta para facturar.");
        setFacturando(false);
        return;
      }
      // Validación por pieza según su propio momento
      const excedida = maletas.find((m) => m.peso > cfgMap[m.momento_compra].peso_max_por_maleta);
      if (excedida) {
        const max = cfgMap[excedida.momento_compra].peso_max_por_maleta;
        setErrorMsg(`No puedes facturar: hay una maleta con más de ${max} kg para '${excedida.momento_compra}'.`);
        setFacturando(false);
        return;
      }

      const { error } = await supabase
        .from("equipaje")
        .update({
          estado: "facturado",
          usuario_facturo: usuarioActual ?? null,
        })
        .eq("id_equipaje", equipaje.id_equipaje);

      if (error) throw error;
      await getOrCreateEquipaje();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al facturar equipaje.");
    } finally {
      setFacturando(false);
    }
  };

  /** Cargar datos para PDF */
  const cargarDatosFactura = async (idEquipaje: number) => {
    const { data, error } = await supabase
      .from("equipaje")
      .select(`
        id_equipaje, id_ticket, estado, cantidad, peso_total,
        pasajero:pasajero (
          id_persona,
          persona:persona ( nombre, apellido, tipo_documento, numero_documento )
        ),
        ticket:ticket (
          id_ticket,
          vuelo:vuelo ( id_vuelo, fecha_hora_salida )
        )
      `)
      .eq("id_equipaje", idEquipaje)
      .single();
    if (error) throw error;
    return (data as any);
  };

  /** PDF con desglose por pieza + su momento */
  const generarFacturaPDF = async () => {
    if (!equipaje) return;
    if (!maletas.length) {
      alert("No hay maletas registradas.");
      return;
    }
    if ((equipaje.estado ?? "").toLowerCase() !== "facturado") {
      if (!window.confirm("El equipaje no está facturado. ¿Deseas generar una proforma?")) return;
    }

    setGenerandoPDF(true);
    try {
      const ctx = await cargarDatosFactura(equipaje.id_equipaje);
      const doc = new jsPDF();

      const pickFirst = <T,>(v: T | T[] | null | undefined): T | undefined =>
        Array.isArray(v) ? v[0] : (v ?? undefined);

      const pasaj = pickFirst<any>(ctx.pasajero);
      const persona = pickFirst<any>(pasaj?.persona);
      const tick = pickFirst<any>(ctx.ticket);
      const vuelo = pickFirst<any>(tick?.vuelo);

      const nombre = `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim();
      const docu = `${persona?.tipo_documento ?? ""}: ${persona?.numero_documento ?? ""}`;
      const vueloId = vuelo?.id_vuelo ?? "-";

      // Encabezado
      doc.setFontSize(12);
      doc.text(`Pasajero: ${nombre || "-"}`, 14, 18);
      doc.text(`Documento: ${docu}`, 14, 26);
      doc.text(`Ticket: ${ctx.id_ticket ?? "-"}`, 110, 18);
      doc.text(`Vuelo: ${vueloId}`, 110, 26);

      // Tabla maletas (incluye momento de compra por pieza)
      const rows = maletas.map((m, i) => [
        i + 1,
        m.tipo,
        m.peso.toFixed(2),
        m.momento_compra,
        m.estado ?? "registrada",
      ]);
      (autoTable as any)(doc, {
        head: [["#", "Tipo", "Peso (kg)", "Momento", "Estado"]],
        body: rows,
        startY: 40,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [17, 24, 39] },
      });

      // Tarifas calculadas por pieza según SU momento
      const { lineas, total } = calcularTarifasPorPieza(maletas, cfgMap);
      const tarifasBody = lineas.map((l) => [l.concepto, `USD ${l.monto.toFixed(2)}`]);
      const startY2 = (doc as any).lastAutoTable.finalY + 8;

      (autoTable as any)(doc, {
        head: [["Concepto", "Importe"]],
        body: tarifasBody,
        startY: startY2,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 102, 228] },
        columnStyles: { 1: { halign: "right" } },
      });

      const yTot = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(12);
      doc.text(`TOTAL: USD ${total.toFixed(2)}`, 14, yTot);

      doc.setFontSize(9);
      doc.text(
        `1ª maleta gratis (global). Sobrepeso por pieza según su momento. Peso máx. por pieza depende del momento.`,
        14,
        yTot + 12
      );

      const nombreArchivo = `Factura_Equipaje_T${ctx.id_ticket ?? "N"}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(nombreArchivo);
    } catch (e: any) {
      console.error(e);
      alert(e.message ?? "No se pudo generar el PDF.");
    } finally {
      setGenerandoPDF(false);
    }
  };

  /** Resumen por momento (cantidad y peso) */
  const resumen = useMemo(() => resumirPorMomento(maletas), [maletas]);

  return (
    <div className="equipaje-container">
      {errorMsg && <div className="equipaje-alert">{errorMsg}</div>}

      {loading ? (
        <p>Cargando equipaje…</p>
      ) : equipaje ? (
        <div className="equipaje-content">
          {/* ====== RESUMEN GENERAL ====== */}
          <section className="equipaje-card equipaje-resumen">
            <h2 className="equipaje-title">Gestión de Equipaje</h2>

            <div><strong>Ticket:</strong> {equipaje.id_ticket}</div>
            <div><strong>Pasajero (id_persona):</strong> {equipaje.id_pasajero}</div>
            <div>
              <strong>Estado:</strong>{" "}
              <span className={`badge badge-${(equipaje.estado ?? "registrado").toLowerCase()}`}>
                {equipaje.estado ?? "registrado"}
              </span>
            </div>
            <div><strong>Cantidad de maletas:</strong> {equipaje.cantidad ?? 0}</div>
            <div><strong>Peso total:</strong> {(equipaje.peso_total ?? 0).toFixed(2)} kg</div>

            <div className="equipaje-actions">
              <button
                onClick={facturar}
                disabled={!puedeFacturar || yaFacturado || facturando || readOnly}
                title={!puedeFacturar ? `Verifica pesos máximos por momento` : ""}
              >
                {yaFacturado ? "Ya facturado" : facturando ? "Facturando…" : "Facturar equipaje"}
              </button>
              <button
                onClick={generarFacturaPDF}
                disabled={generandoPDF || maletas.length === 0}
              >
                {generandoPDF ? "Generando PDF…" : "Descargar factura PDF"}
              </button>
            </div>
          </section>

          {/* ====== RESUMEN POR MOMENTO ====== */}
          <section className="equipaje-card equipaje-config">
            <h3>Resumen por momento</h3>
            <div className="equipaje-config-grid">
              {(["web","checkin","abordaje"] as MomentoCompra[]).map((m) => (
                <div className="equipaje-config-detalle" key={m}>
                  <div className="equipaje-config-title">{m.toUpperCase()}</div>
                  <div>Cantidad: <strong>{resumen[m].cantidad}</strong></div>
                  <div>Peso total: <strong>{resumen[m].peso.toFixed(2)} kg</strong></div>
                  <div>Lím. sin cargo: <strong>{cfgMap[m].limite_kg_sin_cargo} kg</strong></div>
                  <div>Máx. por pieza: <strong>{cfgMap[m].peso_max_por_maleta} kg</strong></div>
                </div>
              ))}
            </div>
          </section>

          {/* ====== TARIFAS (desglose calculado por pieza) ====== */}
          <section className="equipaje-card equipaje-tarifas">
            <h3>Tarifas calculadas</h3>
            {maletas.length === 0 ? (
              <p>Sin maletas registradas.</p>
            ) : (
              (() => {
                const { lineas, total } = calcularTarifasPorPieza(maletas, cfgMap);
                return (
                  <>
                    <ul className="tarifas-lista">
                      {lineas.map((l, i) => (
                        <li key={i} className="tarifa-item">
                          <span>{l.concepto}</span>
                          <strong>USD {l.monto.toFixed(2)}</strong>
                        </li>
                      ))}
                    </ul>
                    <div className="tarifa-total">
                      <span>Total</span>
                      <strong>USD {total.toFixed(2)}</strong>
                    </div>
                    <p className="tarifa-nota">
                      La <strong>1ª maleta es gratis</strong> (global). Cada pieza aplica <em>sus</em> reglas
                      según el <strong>momento de compra</strong>.
                    </p>
                  </>
                );
              })()
            )}
          </section>

          {/* ====== FORM: agregar maleta con momento_compra ====== */}
          {!readOnly && (
            <section className="equipaje-card equipaje-form">
              <h3>Añadir maleta</h3>
              <form onSubmit={agregarMaleta} className="equipaje-form-grid">
                <label>
                  Tipo
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as any }))}
                  >
                    <option value="bodega">Bodega</option>
                    <option value="mano">Mano</option>
                    <option value="especial">Especial</option>
                  </select>
                </label>

                <label>
                  Peso (kg)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.peso}
                    onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))}
                    placeholder="Ej. 18.50"
                  />
                </label>

                <label>
                  Momento de compra
                  <select
                    value={form.momento_compra}
                    onChange={(e) => setForm((f) => ({ ...f, momento_compra: e.target.value as MomentoCompra }))}
                  >
                    <option value="web">Compra del vuelo (Web / Anticipado)</option>
                    <option value="checkin">Check‑in</option>
                    <option value="abordaje">Abordaje (antes de entrar)</option>
                  </select>
                </label>

                <div className="equipaje-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? "Guardando…" : "Agregar maleta"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ====== TABLA ====== */}
          <section className="equipaje-card equipaje-lista">
            <h3>Maletas</h3>
            {maletas.length === 0 ? (
              <p>Sin maletas registradas.</p>
            ) : (
              <table className="equipaje-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Peso (kg)</th>
                    <th>Momento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {maletas.map((m) => {
                    const max = cfgMap[m.momento_compra].peso_max_por_maleta;
                    return (
                      <tr key={m.id_maleta}>
                        <td>{m.id_maleta}</td>
                        <td>{m.tipo}</td>
                        <td>
                          {m.peso.toFixed(2)}
                          {m.peso > max && (
                            <span className="badge badge-alert" title={`Excede ${max} kg para '${m.momento_compra}'`}>
                              exceso
                            </span>
                          )}
                        </td>
                        <td>{m.momento_compra}</td>
                        <td>{m.estado ?? "registrada"}</td>
                        <td>
                          {!readOnly ? (
                            <button type="button" onClick={() => eliminarMaleta(m.id_maleta)} disabled={saving}>
                              Eliminar
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      ) : (
        <p>No se encontró/creó el encabezado de equipaje.</p>
      )}
    </div>
  );
}
