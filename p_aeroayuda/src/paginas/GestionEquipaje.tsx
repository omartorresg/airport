import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/Gestion_Equipaje.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Equipaje = {
  id_equipaje: number;
  id_pasajero: number;
  id_ticket: number;
  estado: string | null;
  cantidad: number | null;
  peso_total: number | null;
  usuario_facturo: string | null;
};

type Maleta = {
  id_maleta: number;
  id_equipaje: number;
  tipo: "mano" | "bodega" | "especial";
  peso: number;
  estado: string | null;
};

type Props = {
  idPersona: number;
  idTicket: number;
  usuarioActual?: string;
  readOnly?: boolean;
};

/* ====== TARIFAS (1ª maleta gratis) ====== */
const TARIFA_SEGUNDA_MALETA = 30;
const TARIFA_SOBREPESO = 50;
const TARIFA_ESPECIAL = 100;
const LIMITE_KG_SIN_CARGO = 23;
const PESO_MAX_POR_MALETA = 25;

function calcularTarifas(maletas: Maleta[]) {
  const lineas: { concepto: string; monto: number }[] = [];
  let total = 0;

  const ordenadas = [...maletas].sort((a, b) => (a.id_maleta ?? 0) - (b.id_maleta ?? 0));
  ordenadas.forEach((m, idx) => {
    const num = idx + 1;

    // 1) Pieza: la primera gratis
    if (idx === 0) {
      lineas.push({ concepto: `Maleta ${num} (gratis)`, monto: 0 });
    } else {
      lineas.push({ concepto: `Maleta ${num}`, monto: TARIFA_SEGUNDA_MALETA });
      total += TARIFA_SEGUNDA_MALETA;
    }

    // 2) Especial
    if (m.tipo === "especial") {
      lineas.push({ concepto: `Maleta ${num} - especial`, monto: TARIFA_ESPECIAL });
      total += TARIFA_ESPECIAL;
    }

    // 3) Sobrepeso
    if ((m.peso ?? 0) > LIMITE_KG_SIN_CARGO) {
      lineas.push({ concepto: `Maleta ${num} - sobrepeso`, monto: TARIFA_SOBREPESO });
      total += TARIFA_SOBREPESO;
    }
  });

  return { lineas, total };
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

  // Form para nueva maleta
  const [form, setForm] = useState({
    tipo: "bodega" as "mano" | "bodega" | "especial",
    peso: "",
  });

  const puedeFacturar = useMemo(() => {
    if (!equipaje) return false;
    const cant = equipaje.cantidad ?? 0;
    const estado = (equipaje.estado ?? "").toLowerCase();
    const sinExcesos = maletas.every((m) => m.peso <= PESO_MAX_POR_MALETA);
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

      const { data: mList, error: e3 } = await supabase
        .from("maleta")
        .select("id_maleta,id_equipaje,tipo,peso,estado")
        .eq("id_equipaje", eq.id_equipaje)
        .order("id_maleta", { ascending: true })
        .returns<Maleta[]>();
      if (e3) throw e3;
      setMaletas(mList ?? []);
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

  /** Insertar maleta */
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
      if (peso > PESO_MAX_POR_MALETA) {
        setErrorMsg(`El peso máximo por pieza es ${PESO_MAX_POR_MALETA} kg.`);
        setSaving(false);
        return;
      }

      const payload = {
        id_equipaje: equipaje.id_equipaje,
        tipo: form.tipo,
        peso,
        estado: "registrada" as string,
      };
      const { error } = await supabase.from("maleta").insert(payload);
      if (error) throw error;

      // Recalcula totales
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
      setForm({ tipo: "bodega", peso: "" });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al agregar maleta.");
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

  /** Facturar (valida pesos máximos) */
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
      const excedida = maletas.find((m) => m.peso > PESO_MAX_POR_MALETA);
      if (excedida) {
        setErrorMsg(`No puedes facturar: hay una maleta con más de ${PESO_MAX_POR_MALETA} kg.`);
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

  /** Datos para encabezado del PDF */
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

  /** Generar PDF con desglose (1ª maleta gratis) */
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

      // Tabla maletas
      const rows = maletas.map((m, i) => [i + 1, m.tipo, m.peso.toFixed(2), m.estado ?? "registrada"]);
      (autoTable as any)(doc, {
        head: [["#", "Tipo", "Peso (kg)", "Estado"]],
        body: rows,
        startY: 40,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [17, 24, 39] },
      });

      // Tarifas
      const { lineas, total } = calcularTarifas(maletas);
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
        `Primera maleta gratis. Sobrepeso a partir de ${LIMITE_KG_SIN_CARGO} kg. Peso máximo por pieza: ${PESO_MAX_POR_MALETA} kg.`,
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

  return (
    <div className="equipaje-container">
      {errorMsg && <div className="equipaje-alert">{errorMsg}</div>}

      {loading ? (
        <p>Cargando equipaje…</p>
      ) : equipaje ? (
        <div className="equipaje-content">
          {/* ====== TARJETA RESUMEN CON TÍTULO ====== */}
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
                title={!puedeFacturar ? `Verifica que haya maletas y ninguna supere ${PESO_MAX_POR_MALETA} kg` : ""}
              >
                {yaFacturado ? "Ya facturado" : facturando ? "Facturando…" : "Facturar equipaje"}
              </button>
              <button
                onClick={generarFacturaPDF}
                disabled={generandoPDF || maletas.length === 0}
                title={maletas.length === 0 ? "Agrega al menos una maleta" : ""}
              >
                {generandoPDF ? "Generando PDF…" : "Descargar factura PDF"}
              </button>
            </div>
          </section>

          {/* ====== TARJETA TARIFAS ====== */}
          <section className="equipaje-card equipaje-tarifas">
            <h3>Tarifas</h3>
            {maletas.length === 0 ? (
              <p>Sin maletas registradas.</p>
            ) : (
              (() => {
                const { lineas, total } = calcularTarifas(maletas);
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
                      Primera maleta <strong>gratis</strong>. Sobrepeso a partir de{" "}
                      <strong>{LIMITE_KG_SIN_CARGO} kg</strong>. Peso máximo por pieza:{" "}
                      <strong>{PESO_MAX_POR_MALETA} kg</strong>.
                    </p>
                  </>
                );
              })()
            )}
          </section>

          {/* ====== TARJETA FORM ====== */}
          {!readOnly && (
            <section className="equipaje-card equipaje-form">
              <h3>Añadir maleta</h3>
              <form onSubmit={agregarMaleta}>
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

                <div className="equipaje-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? "Guardando…" : "Agregar maleta"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ====== TARJETA TABLA ====== */}
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
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {maletas.map((m) => (
                    <tr key={m.id_maleta}>
                      <td>{m.id_maleta}</td>
                      <td>{m.tipo}</td>
                      <td>
                        {m.peso.toFixed(2)}
                        {m.peso > PESO_MAX_POR_MALETA && (
                          <span className="badge badge-alert" title={`Excede ${PESO_MAX_POR_MALETA} kg`}>
                            exceso
                          </span>
                        )}
                      </td>
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
                  ))}
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
