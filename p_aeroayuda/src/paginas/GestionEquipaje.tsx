import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/Gestion_Equipaje.css"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


type Equipaje = {
  id_equipaje: number;
  id_pasajero: number;
  id_ticket: number;
  estado: string | null;
  cantidad: number | null;
  peso_total: number | null;
  fecha_facturacion: string | null;
  usuario_facturo: string | null;
};

type Maleta = {
  id_maleta: number;
  id_equipaje: number;
  tipo: "mano" | "bodega" | "especial";
  peso: number;
  alto_cm: number | null;
  ancho_cm: number | null;
  largo_cm: number | null;
  codigo_tag: string | null;
  estado: string | null;
  fecha_registro: string | null;
};

type Props = {
  /** PK compartida persona↔pasajero */
  idPersona: number;
  /** Ticket actual de ese pasajero */
  idTicket: number;
  /** (opcional) Usuario que factura (para auditar) */
  usuarioActual?: string;
  /** Modo lectura: oculta edición si true */
  readOnly?: boolean;
};

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form para nueva maleta
  const [form, setForm] = useState({
    tipo: "bodega" as "mano" | "bodega" | "especial",
    peso: "",
    alto_cm: "",
    ancho_cm: "",
    largo_cm: "",
    codigo_tag: "",
  });

  const puedeFacturar = useMemo(() => {
    if (!equipaje) return false;
    const cant = equipaje.cantidad ?? 0;
    return cant > 0 && (equipaje.estado ?? "").toLowerCase() !== "facturado";
  }, [equipaje]);

  const yaFacturado = useMemo(() => {
    return (equipaje?.estado ?? "").toLowerCase() === "facturado";
  }, [equipaje]);

  // 1) Carga/crea encabezado equipaje por (idPersona, idTicket)
  const getOrCreateEquipaje = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Intentar traerlo
      let { data: eq, error: e1 } = await supabase
        .from("equipaje")
        .select("*")
        .eq("id_pasajero", idPersona)
        .eq("id_ticket", idTicket)
        .maybeSingle<Equipaje>();

      if (e1 && e1.code !== "PGRST116") {
        // PGRST116 = no rows
        throw e1;
      }

      if (!eq) {
        // Crear (usamos UNIQUE (id_pasajero,id_ticket) si lo tienes)
        const { data: inserted, error: e2 } = await supabase
          .from("equipaje")
          .upsert(
            {
              id_pasajero: idPersona,
              id_ticket: idTicket,
              estado: "registrado",
              cantidad: 0,
              peso_total: 0,
            },
            { onConflict: "id_pasajero,id_ticket" }
          )
          .select("*")
          .single<Equipaje>();
        if (e2) throw e2;
        eq = inserted;
      }

      setEquipaje(eq);

      // Cargar maletas
      const { data: mList, error: e3 } = await supabase
        .from("maleta")
        .select("*")
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

  // 2) Insertar maleta
  const agregarMaleta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipaje) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const peso = Number(form.peso);
      if (Number.isNaN(peso) || peso <= 0) {
        setErrorMsg("El peso debe ser un número mayor que 0.");
        setSaving(false);
        return;
      }

      const payload = {
        id_equipaje: equipaje.id_equipaje,
        tipo: form.tipo,
        peso,
        alto_cm: form.alto_cm ? Number(form.alto_cm) : null,
        ancho_cm: form.ancho_cm ? Number(form.ancho_cm) : null,
        largo_cm: form.largo_cm ? Number(form.largo_cm) : null,
        codigo_tag: form.codigo_tag || null,
      };

      const { error } = await supabase.from("maleta").insert(payload);
      if (error) throw error;

      // Trigger en BD recalcula totales: recarga encabezado y maletas
      await getOrCreateEquipaje();

      // limpiar form
      setForm({
        tipo: "bodega",
        peso: "",
        alto_cm: "",
        ancho_cm: "",
        largo_cm: "",
        codigo_tag: "",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al agregar maleta.");
    } finally {
      setSaving(false);
    }
  };

  // 3) Eliminar maleta
  const eliminarMaleta = async (id_maleta: number) => {
    if (!equipaje || readOnly) return;
    if (!window.confirm("¿Eliminar esta maleta?")) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from("maleta").delete().eq("id_maleta", id_maleta);
      if (error) throw error;
      await getOrCreateEquipaje();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Error al eliminar maleta.");
    } finally {
      setSaving(false);
    }
  };

  // 4) Facturar (simple UPDATE; sin RPC)
  const facturar = async () => {
    if (!equipaje || readOnly) return;
    setFacturando(true);
    setErrorMsg(null);
    try {
      if (!puedeFacturar) {
        setErrorMsg("Debes tener al menos 1 maleta para facturar.");
        setFacturando(false);
        return;
      }

      const { error } = await supabase
        .from("equipaje")
        .update({
          estado: "facturado",
          fecha_facturacion: new Date().toISOString(),
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

  // Lee datos para el encabezado del PDF (persona + ticket + vuelo básico)
const cargarDatosFactura = async (idEquipaje: number) => {
    const { data, error } = await supabase
      .from("equipaje")
      .select(`
        id_equipaje, id_ticket, estado, cantidad, peso_total, fecha_facturacion,
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
    return data;
  };

  const [generandoPDF, setGenerandoPDF] = useState(false);

// Reglas de ejemplo (puedes cambiarlas o quitar el cálculo)
const TARIFA_SEGUNDA_MALETA = 30;    // USD
const TARIFA_SOBREPESO = 50;         // USD (>23kg)
const TARIFA_ESPECIAL = 100;         // USD por maleta 'especial'
const LIMITE_KG_SIN_CARGO = 23;

const generarFacturaPDF = async () => {
  if (!equipaje) return;
  if (!maletas.length) { alert("No hay maletas registradas."); return; }
  if ((equipaje.estado ?? "").toLowerCase() !== "facturado") {
    if (!window.confirm("El equipaje no está facturado. ¿Deseas generar una proforma?")) return;
  }

  setGenerandoPDF(true);
  try {
    const ctx = await cargarDatosFactura(equipaje.id_equipaje);
    const doc = new jsPDF();

   // 🔧 Normaliza: si viene array, toma el primero
const pickFirst = <T,>(v: T | T[] | null | undefined): T | undefined =>
Array.isArray(v) ? v[0] : v ?? undefined;

const pasaj   = pickFirst(ctx.pasajero);
const persona = pickFirst(pasaj?.persona);
const tick    = pickFirst(ctx.ticket);
const vuelo   = pickFirst(tick?.vuelo);

// ✅ Usa estas variables en lugar de ctx.pasajero?.persona o ctx.ticket?.vuelo
const nombre = `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim();
const docu   = `${persona?.tipo_documento ?? ""}: ${persona?.numero_documento ?? ""}`;
const vueloId = vuelo?.id_vuelo ?? "-";


    // Tabla de maletas
    const rows = maletas.map((m, i) => [
      i + 1,
      m.tipo,
      m.peso.toFixed(2),
      m.codigo_tag ?? "-",
      m.estado ?? "registrada",
    ]);

    (autoTable as any)(doc, {
      head: [["#", "Tipo", "Peso (kg)", "TAG", "Estado"]],
      body: rows,
      startY: 46,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] },
    });

    // Totales + (opcional) cálculo simple de importes
    const y = (doc as any).lastAutoTable.finalY + 8;
    const cantidad = equipaje.cantidad ?? maletas.length;
    const pesoTotal = equipaje.peso_total ?? maletas.reduce((s, m) => s + (m.peso || 0), 0);

    // Cálculo de ejemplo (ajústalo a tus reglas o elimínalo)
    let totalUSD = 0;
    if (cantidad >= 2) totalUSD += (cantidad - 1) * TARIFA_SEGUNDA_MALETA;
    for (const m of maletas) {
      if (m.tipo === "especial") totalUSD += TARIFA_ESPECIAL;
      if ((m.peso ?? 0) > LIMITE_KG_SIN_CARGO) totalUSD += TARIFA_SOBREPESO;
    }

    doc.text(`Pasajero: ${nombre || "-"}`, 14, 26);
    doc.text(`Documento: ${docu}`, 14, 32);
    doc.text(`Ticket: ${ctx.id_ticket ?? "-"}`, 110, 26);
    doc.text(`Vuelo: ${vueloId}`, 110, 32);
    

    doc.setFontSize(9);
    doc.text("* Las tarifas son de ejemplo. Ajusta reglas y valores según tu política.", 14, y + 20);

    const nombreArchivo = `Factura_Equipaje_T${ctx.id_ticket ?? "N"}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nombreArchivo);
  } catch (e:any) {
    console.error(e);
    alert(e.message ?? "No se pudo generar la factura.");
  } finally {
    setGenerandoPDF(false);
  }
};


  return (
    <div className="equipaje-container">
      <h2>Gestión de Equipaje</h2>

      {errorMsg && <div className="equipaje-alert">{errorMsg}</div>}

      {loading ? (
        <p>Cargando equipaje…</p>
      ) : equipaje ? (
        <div className="equipaje-content">
          <section className="equipaje-resumen">
            <div>
              <strong>Ticket:</strong> {equipaje.id_ticket}
            </div>
            <div>
              <strong>Pasajero (id_persona):</strong> {equipaje.id_pasajero}
            </div>
            <div>
              <strong>Estado:</strong>{" "}
              <span className={`badge badge-${(equipaje.estado ?? "registrado").toLowerCase()}`}>
                {equipaje.estado ?? "registrado"}
              </span>
            </div>
            <div>
              <strong>Cantidad de maletas:</strong> {equipaje.cantidad ?? 0}
            </div>
            <div>
              <strong>Peso total:</strong> {(equipaje.peso_total ?? 0).toFixed(2)} kg
            </div>

            <div className="equipaje-actions">
              <button
                onClick={facturar}
                disabled={!puedeFacturar || yaFacturado || facturando || readOnly}
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

          {!readOnly && (
            <section className="equipaje-form">
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

                <div className="grid-3">
                  <label>
                    Alto (cm)
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.alto_cm}
                      onChange={(e) => setForm((f) => ({ ...f, alto_cm: e.target.value }))}
                    />
                  </label>
                  <label>
                    Ancho (cm)
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.ancho_cm}
                      onChange={(e) => setForm((f) => ({ ...f, ancho_cm: e.target.value }))}
                    />
                  </label>
                  <label>
                    Largo (cm)
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.largo_cm}
                      onChange={(e) => setForm((f) => ({ ...f, largo_cm: e.target.value }))}
                    />
                  </label>
                </div>

                <label>
                  Código TAG
                  <input
                    type="text"
                    value={form.codigo_tag}
                    onChange={(e) => setForm((f) => ({ ...f, codigo_tag: e.target.value }))}
                    placeholder="Opcional (IATA/QR)"
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

          <section className="equipaje-lista">
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
                    <th>Dimensiones (cm)</th>
                    <th>TAG</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {maletas.map((m) => (
                    <tr key={m.id_maleta}>
                      <td>{m.id_maleta}</td>
                      <td>{m.tipo}</td>
                      <td>{m.peso.toFixed(2)}</td>
                      <td>
                        {[
                          m.alto_cm ? `${m.alto_cm}↑` : "",
                          m.ancho_cm ? `${m.ancho_cm}↔` : "",
                          m.largo_cm ? `${m.largo_cm}↕` : "",
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      </td>
                      <td>{m.codigo_tag ?? "-"}</td>
                      <td>
                        {!readOnly ? (
                          <button onClick={() => eliminarMaleta(m.id_maleta)} disabled={saving}>
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
