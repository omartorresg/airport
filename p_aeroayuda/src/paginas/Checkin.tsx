import React, { useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/checkin.css";

type ReservaRaw = {
  id_reserva: number;
  codigo_reserva: string;
  estado: string | null;
  check_in_realizado: boolean | null;
  pasajero: {
    id_persona: number; // PK compartida con persona
    persona: {
      nombre: string;
      apellido: string;
      tipo_documento: string;
      numero_documento: string;
    } | null;
  } | null;
  vuelo: {
    id_vuelo: number;
    estado: string | null;
    hora_abordaje: string | null;       // time
    fecha_hora_salida: string | null;   // timestamp
    fecha_hora_llegada: string | null;  // timestamp
    id_origen: number | null;
    id_destino: number | null;
  } | null;
};

type CheckInRaw = { estado_checkin: string | null; fecha_hora: string | null } | null;

interface UIReserva {
  idReserva: number;
  idPasajero: number;                 // 👈 NUEVO
  codigoReserva: string;
  pasajeroNombre: string;
  pasajeroDocumento: string;
  vueloId: number | null;
  vueloEstado: string | null;
  horaAbordaje: string | null;
  salida: string | null;
  llegada: string | null;
  origen: number | null;
  destino: number | null;
  checkInConfirmado: boolean;
  checkInEstado: string | null;
  checkInFecha: string | null;
  activa: boolean;
}

export default function CheckIn() {
  const [codigo, setCodigo] = useState("");
  const [info, setInfo] = useState<UIReserva | null>(null);
  const [asiento, setAsiento] = useState(""); // (tu tabla check_in no tiene asiento; si lo agregas, lo guardamos)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // 👈 NUEVO

  const buscarReserva = async () => {
    try {
      setLoading(true);
      const cod = codigo.trim();
      if (!cod) {
        alert("Ingresa un código de reserva.");
        return;
      }

      // 1) Reserva + pasajero(persona) + vuelo
      const { data: r, error } = await supabase
        .from("reserva")
        .select(`
          id_reserva,
          codigo_reserva,
          estado,
          check_in_realizado,
          pasajero:pasajero (
            id_persona,
            persona:persona (
              nombre,
              apellido,
              tipo_documento,
              numero_documento
            )
          ),
          vuelo:vuelo (
            id_vuelo,
            estado,
            hora_abordaje,
            fecha_hora_salida,
            fecha_hora_llegada,
            id_origen,
            id_destino
          )
        `)
        .eq("codigo_reserva", cod)
        .maybeSingle<ReservaRaw>();

      if (error || !r || !r.pasajero?.persona || !r.vuelo) {
        console.warn(error);
        alert("Reserva no encontrada o datos incompletos.");
        return;
      }

      // 2) Último check-in (si existe)
      const { data: ci, error: e2 } = await supabase
        .from("check_in")
        .select("estado_checkin, fecha_hora")
        .eq("id_reserva", r.id_reserva)
        .order("fecha_hora", { ascending: false })
        .limit(1)
        .maybeSingle<CheckInRaw>();

      if (e2) console.warn("Lectura check_in:", e2.message);

      // 3) Calcular 'activa'
      const estadoReserva = (r.estado ?? "").toLowerCase();
      const estadoVuelo = (r.vuelo.estado ?? "").toLowerCase();
      const salidaDate = r.vuelo.fecha_hora_salida
        ? new Date(r.vuelo.fecha_hora_salida)
        : null;
      const activa =
        (estadoReserva === "confirmada" || estadoReserva === "pagada") &&
        estadoVuelo !== "cancelado" &&
        (!!salidaDate && salidaDate >= new Date());

      const p = r.pasajero.persona;

      setInfo({
        idReserva: r.id_reserva,
        idPasajero: r.pasajero.id_persona,        // 👈 guardamos el id del pasajero
        codigoReserva: r.codigo_reserva,
        pasajeroNombre: `${p.nombre} ${p.apellido}`,
        pasajeroDocumento: `${p.tipo_documento}: ${p.numero_documento}`,
        vueloId: r.vuelo.id_vuelo,
        vueloEstado: r.vuelo.estado,
        horaAbordaje: r.vuelo.hora_abordaje,
        salida: r.vuelo.fecha_hora_salida,
        llegada: r.vuelo.fecha_hora_llegada,
        origen: r.vuelo.id_origen,
        destino: r.vuelo.id_destino,
        checkInConfirmado:
          (ci?.estado_checkin ?? "").toLowerCase() === "confirmado",
        checkInEstado: ci?.estado_checkin ?? null,
        checkInFecha: ci?.fecha_hora ?? null,
        activa,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarCheckIn = async () => {
    if (!info) return;
    try {
      setSaving(true);

      // 1) Insertar en check_in
      const { error: e1 } = await supabase.from("check_in").insert([
        {
          id_reserva: info.idReserva,
          id_pasajero: info.idPasajero,     // 👈 ahora lo enviamos
          fecha_hora: new Date().toISOString(),
          estado_checkin: "confirmado",
          id_empleado: null,
          estado: "activo",
          // asiento: asiento || null,      // 👈 Si agregas columna 'asiento' a check_in, descomenta
        },
      ]);
      if (e1) throw e1;

      // 2) Marcar la reserva como check_in_realizado = true
      const { error: e2 } = await supabase
        .from("reserva")
        .update({ check_in_realizado: true })
        .eq("id_reserva", info.idReserva);
      if (e2) throw e2;

      // 3) Volver a leer el último check-in para refrescar cabecera
      const { data: ci, error: e3 } = await supabase
        .from("check_in")
        .select("estado_checkin, fecha_hora")
        .eq("id_reserva", info.idReserva)
        .order("fecha_hora", { ascending: false })
        .limit(1)
        .maybeSingle<CheckInRaw>();
      if (e3) throw e3;

      setInfo({
        ...info,
        checkInConfirmado: (ci?.estado_checkin ?? "").toLowerCase() === "confirmado",
        checkInEstado: ci?.estado_checkin ?? "confirmado",
        checkInFecha: ci?.fecha_hora ?? new Date().toISOString(),
      });
    } catch (err: any) {
      alert(err.message || "No se pudo confirmar el check-in.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (


    
    <div className="checkin-container">
      <header className="checkin-hero">
      <div className="checkin-hero-inner">
        <h1 className="checkin-hero-title">Check‑In de Pasajeros</h1>
      </div>
    </header>
      <div className="checkin-card">
        <h1 className="checkin-title">Infomación Check-In</h1>

        <input
          className="checkin-input"
          placeholder="Código de reserva"
          value={codigo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCodigo(e.target.value)
          }
        />

        <button className="checkin-button" onClick={buscarReserva} disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {info && (
          <div className="passenger-info">
            <p><strong>Reserva:</strong> {info.codigoReserva}</p>
            <p><strong>Activa:</strong> {info.activa ? "✅ Sí" : "❌ No"}</p>

            <hr className="divider" />

            <p><strong>Pasajero:</strong> {info.pasajeroNombre}</p>
            <p><strong>Documento:</strong> {info.pasajeroDocumento}</p>

            <hr className="divider" />

            <p><strong>Vuelo:</strong> #{info.vueloId} ({info.vueloEstado ?? "N/D"})</p>
            <p><strong>Hora de abordaje:</strong> {info.horaAbordaje ?? "N/D"}</p>
            <p><strong>Salida:</strong> {info.salida ?? "N/D"}</p>
            <p><strong>Llegada:</strong> {info.llegada ?? "N/D"}</p>
            <p><strong>Origen/Destino:</strong> {info.origen ?? "?"} → {info.destino ?? "?"}</p>

            <hr className="divider" />

            <p>
              <strong>Check‑In:</strong>{" "}
              {info.checkInConfirmado ? "Confirmado ✅" : (info.checkInEstado ?? "Sin registro")}
            </p>

            {!info.checkInConfirmado && (
              <div className="space-y-2">
                <input
                  className="checkin-input"
                  placeholder="Asiento (opcional)"
                  value={asiento}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAsiento(e.target.value)
                  }
                />
                <button className="checkin-button" onClick={confirmarCheckIn} disabled={saving}>
                  {saving ? "Confirmando..." : "Confirmar Check‑In"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
