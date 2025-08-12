import React, { useMemo, useState } from "react";
import { supabase } from "../SupabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/GeneracionPasesAbordaje.css";

/** ===== Tipos ===== */
type Persona = {
  nombre: string;
  apellido: string;
  tipo_documento?: string | null;
  numero_documento?: string | null;
};

type AeropuertoRef = { nombre?: string | null; iata?: string | null };

type Vuelo = {
  id_vuelo: number;
  // En BD son id_origen / id_destino; aquí usamos números/IDs y refs opcionales
  origen: number | string;
  destino: number | string;
  fecha_hora_salida: string | null;
  hora_abordaje: string | null;
  estado?: string | null;
  origen_ref?: AeropuertoRef | null;
  destino_ref?: AeropuertoRef | null;
};

type TicketInfo = {
  id_ticket: number;
  fila?: string | null;          // la fila que guarda el ticket (si tu diseño la usa)
  estado?: string | null;
  fecha_compra?: string | null;
  id_asiento?: number | null;    // por si quieres usarlo luego
  vuelo: Vuelo | null;
  asiento?: any | null;          // dejamos 'any' porque el esquema de asiento varía
};

type Resultado = {
  id_ticket: number;
  id_persona: number;
  persona: Persona | null;
  ticket: TicketInfo | null;
};

export default function GeneracionPaseAbordaje() {
  const [idTicket, setIdTicket] = useState("");
  const [data, setData] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pasajeroNombre = useMemo(() => {
    const p = data?.persona;
    if (!p) return "";
    return `${(p.nombre ?? "").trim()} ${(p.apellido ?? "").trim()}`.trim();
  }, [data]);

  const formatearFecha = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
  };

  // Usa cualquier combinación de nombres que pueda tener tu tabla asiento
  const formatearAsiento = (a?: any, ticketFila?: string | null) => {
    const fila =
      a?.fila ?? a?.letra ?? a?.letra_fila ?? a?.fila_asiento ?? ticketFila ?? null;
    const numero =
      a?.numero ?? a?.num_asiento ?? a?.posicion ?? a?.nro ?? null;
    if (fila && numero) return `${fila}-${numero}`;
    return fila ?? numero ?? "-";
  };

  const mostrarAeropuerto = (idValor: number | string, ref?: AeropuertoRef | null) => {
    if (ref?.iata || ref?.nombre) {
      const iata = (ref.iata ?? "").toString().toUpperCase();
      const nombre = ref.nombre ?? "";
      return [iata, nombre].filter(Boolean).join(" - ");
    }
    return String(idValor);
  };

  /** ====== Búsqueda paso a paso (robusta) ====== */
  const handleBuscar = async () => {
    setMsg(null);
    setData(null);
   

    const raw = idTicket.trim();
    const idNum = Number(raw);
    if (!raw || Number.isNaN(idNum)) {
      setMsg("Ingrese un ID de ticket válido (número).");
      return;
    }

    setLoading(true);
    try {
      // 1) Pasajeros que usan ese ticket (pueden ser varios)
      const psgAll = await supabase
        .from("pasajero")
        .select("id_persona, id_ticket")
        .eq("id_ticket", idNum);

      if (psgAll.error) throw psgAll.error;
      if (!psgAll.data || psgAll.data.length === 0) {
        setMsg("No hay pasajero con ese id_ticket.");
        setLoading(false);
        return;
      }
      const psg = psgAll.data[0]; // tomamos el primero

      // 2) Persona
      const per = await supabase
        .from("persona")
        .select("nombre, apellido, tipo_documento, numero_documento")
        .eq("id_persona", psg.id_persona)
        .maybeSingle();
      if (per.error) throw per.error;

      // 3) Ticket
      const tkt = await supabase
        .from("ticket")
        .select("id_ticket, fila, estado, fecha_compra, id_vuelo, id_asiento")
        .eq("id_ticket", idNum)
        .maybeSingle();
      if (tkt.error) throw tkt.error;
      if (!tkt.data) {
        setMsg("El ticket no existe en la tabla ticket.");
        setLoading(false);
        return;
      }

      // 4) Vuelo
      const v = await supabase
        .from("vuelo")
        .select("id_vuelo, id_origen, id_destino, fecha_hora_salida, hora_abordaje, estado")
        .eq("id_vuelo", tkt.data.id_vuelo)
        .maybeSingle();
      if (v.error) throw v.error;

      // 5) Asiento (opcional) —> usamos select("*") para no depender de nombres
      let asiento: any | null = null;
      if (tkt.data.id_asiento != null) {
        const a = await supabase
          .from("asiento")
          .select("*") // <— importante
          .eq("id_asiento", tkt.data.id_asiento)
          .maybeSingle();
        if (a.error) throw a.error;
        asiento = a.data ?? null;
      }

      // 6) Aeropuertos (opcional)
      let origenRef: AeropuertoRef | null = null;
      let destinoRef: AeropuertoRef | null = null;

      if (v.data?.id_origen != null) {
        const ao = await supabase
          .from("aeropuerto")
          .select("nombre, iata")
          .eq("id_aeropuerto", v.data.id_origen)
          .maybeSingle();
        if (ao.error && ao.error.code !== "PGRST116") throw ao.error;
        origenRef = ao.data ?? null;
      }

      if (v.data?.id_destino != null) {
        const ad = await supabase
          .from("aeropuerto")
          .select("nombre, iata")
          .eq("id_aeropuerto", v.data.id_destino)
          .maybeSingle();
        if (ad.error && ad.error.code !== "PGRST116") throw ad.error;
        destinoRef = ad.data ?? null;
      }

      // 7) Armar objeto Resultado
      const resultado: Resultado = {
        id_ticket: tkt.data.id_ticket,
        id_persona: psg.id_persona,
        persona: per.data ?? null,
        ticket: {
          id_ticket: tkt.data.id_ticket,
          fila: tkt.data.fila ?? null,
          estado: tkt.data.estado ?? null,
          fecha_compra: tkt.data.fecha_compra ?? null,
          id_asiento: tkt.data.id_asiento ?? null,
          vuelo: v.data
            ? {
                id_vuelo: v.data.id_vuelo,
                origen: v.data.id_origen,
                destino: v.data.id_destino,
                fecha_hora_salida: v.data.fecha_hora_salida ?? null,
                hora_abordaje: v.data.hora_abordaje ?? null,
                estado: v.data.estado ?? null,
                origen_ref: origenRef,
                destino_ref: destinoRef,
              }
            : null,
          asiento: asiento ?? null,
        },
      };

      // Depuración visible
  
      setData(resultado);
    } catch (e: any) {
      console.error("Error buscar pase:", e);
      setMsg(`Error al buscar datos: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  /** ====== PDF ====== */
  const descargarPDF = () => {
    if (!data?.ticket) return;
    const t = data.ticket;
    if (!t.vuelo) return;
    const v = t.vuelo;
    const p = data.persona;

    const doc = new jsPDF({ unit: "pt" });
    const margenX = 40;
    let y = 48;

    doc.setFontSize(18);
    doc.text("Aeroayuda - Pase de Abordaje", margenX, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Ticket #${t.id_ticket}`, margenX, y + 16);

    const rows = [
      ["Pasajero", pasajeroNombre || "-"],
      ["Documento", `${p?.tipo_documento ?? "-"} ${p?.numero_documento ?? ""}`.trim()],
      ["Origen", mostrarAeropuerto(v.origen, v.origen_ref)],
      ["Destino", mostrarAeropuerto(v.destino, v.destino_ref)],
      ["Hora de abordaje", v.hora_abordaje ?? "-"],
      ["Salida", formatearFecha(v.fecha_hora_salida)],
      ["Asiento", formatearAsiento(t.asiento, t.fila)],
      ["Estado vuelo", v.estado ?? "-"],
    ];

    autoTable(doc, {
      startY: y + 28,
      head: [["Campo", "Valor"]],
      body: rows,
      styles: { fontSize: 11, cellPadding: 6 },
      headStyles: { fillColor: [11, 102, 228] },
      theme: "grid",
      margin: { left: margenX, right: margenX },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? y + 120;
    doc.setFontSize(10);
    doc.text("Generado por Aeroayuda", margenX, finalY + 24);

    doc.save(`pase_ticket_${t.id_ticket}.pdf`);
  };

  /** ====== UI ====== */
  return (
    <div className="pagina-pase">
      <div className="pase-abordaje-container">
        <h2>Generar Pase de Abordaje</h2>

        <input
          className="pase-input"
          placeholder="Ingrese ID del Ticket"
          value={idTicket}
          onChange={(e) => setIdTicket(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
        />

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <button className="pase-btn" onClick={handleBuscar} disabled={loading}>
            {loading ? "Buscando..." : "Buscar y Generar"}
          </button>
        </div>

        {msg && <div className="pase-alerta" style={{ whiteSpace: "pre-wrap" }}>{msg}</div>}
        {data?.ticket?.vuelo && (
          <>
            <div className="pase" id="area-imprimir">
              <div className="pase-header">
                <div className="pase-brand">Aeroayuda</div>
                <div className="pase-id">Ticket #{data.ticket.id_ticket}</div>
              </div>

              <div className="pase-body">
                <div className="pase-col">
                  <div className="pase-label">Pasajero</div>
                  <div className="pase-value">{pasajeroNombre || "-"}</div>

                  <div className="pase-label">Documento</div>
                  <div className="pase-value">
                    {(data.persona?.tipo_documento ?? "-")} {(data.persona?.numero_documento ?? "")}
                  </div>

                  <div className="pase-label">Origen</div>
                  <div className="pase-value">
                    {mostrarAeropuerto(data.ticket.vuelo.origen, data.ticket.vuelo.origen_ref)}
                  </div>

                  <div className="pase-label">Destino</div>
                  <div className="pase-value">
                    {mostrarAeropuerto(data.ticket.vuelo.destino, data.ticket.vuelo.destino_ref)}
                  </div>
                </div>

                <div className="pase-col">
                  <div className="pase-label">Hora de Abordaje</div>
                  <div className="pase-value">{data.ticket.vuelo.hora_abordaje ?? "-"}</div>

                  <div className="pase-label">Salida</div>
                  <div className="pase-value">{formatearFecha(data.ticket.vuelo.fecha_hora_salida)}</div>

                  <div className="pase-label">Asiento</div>
                  <div className="pase-value">{formatearAsiento(data.ticket.asiento, data.ticket.fila)}</div>

                  <div className="pase-label">Estado Vuelo</div>
                  <div className="pase-value">{data.ticket.vuelo.estado ?? "-"}</div>
                </div>
              </div>

              <div className="pase-footer">
                <div className="pase-code">Código: {data.ticket.id_ticket}</div>
              </div>
            </div>

            <div className="pase-actions">
              <button className="pase-btn secundario" onClick={descargarPDF}>
                Descargar PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
