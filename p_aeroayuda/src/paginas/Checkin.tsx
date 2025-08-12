import React, { useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/checkin.css";
import { useNavigate } from "react-router-dom";


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
  origenIata?: string | null;   // 👈 nuevo
  destinoIata?: string | null; 
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
      const cod = codigo.trim().toUpperCase(); // normaliza código
      if (!cod) {
        alert("Ingresa un código de reserva.");
        return;
      }
  
      // 1) Reserva + pasajero(persona) + vuelo (sin joins raros)
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
        .single<ReservaRaw>(); // usa single() para ver el error si no hay match
  
      if (error) {
        console.warn(error);
        alert("Reserva no encontrada.");
        return;
      }
      if (!r || !r.pasajero?.persona || !r.vuelo) {
        alert("Datos incompletos en la reserva.");
        return;
      }
  
      // 2) Trae códigos IATA con los IDs de aeropuertos
      let origenIata: string | null = null;
      let destinoIata: string | null = null;
  
      const ids: number[] = [];
      if (r.vuelo.id_origen) ids.push(r.vuelo.id_origen);
      if (r.vuelo.id_destino) ids.push(r.vuelo.id_destino);
  
      if (ids.length) {
        const { data: aer, error: eA } = await supabase
          .from("aeropuertos")
          .select("id_aeropuerto, codigo_iata")
          .in("id_aeropuerto", ids);
  
        if (!eA && aer) {
          const map = new Map(aer.map(a => [a.id_aeropuerto, a.codigo_iata as string]));
          origenIata = r.vuelo.id_origen ? map.get(r.vuelo.id_origen) ?? null : null;
          destinoIata = r.vuelo.id_destino ? map.get(r.vuelo.id_destino) ?? null : null;
        } else {
          console.warn("Error leyendo aeropuertos:", eA?.message);
        }
      }
  
      // 3) Último check-in
      const { data: ci, error: e2 } = await supabase
        .from("check_in")
        .select("estado_checkin, fecha_hora")
        .eq("id_reserva", r.id_reserva)
        .order("fecha_hora", { ascending: false })
        .limit(1)
        .maybeSingle<CheckInRaw>();
      if (e2) console.warn("Lectura check_in:", e2.message);
  
      // 4) Activa
      const estadoReserva = (r.estado ?? "").toLowerCase();
      const estadoVuelo = (r.vuelo.estado ?? "").toLowerCase();
      const salidaDate = r.vuelo.fecha_hora_salida ? new Date(r.vuelo.fecha_hora_salida) : null;
      const activa =
        (estadoReserva === "confirmada" || estadoReserva === "pagada") &&
        estadoVuelo !== "cancelado" &&
        (!!salidaDate && salidaDate >= new Date());
  
      const p = r.pasajero.persona;
  
      setInfo({
        idReserva: r.id_reserva,
        idPasajero: r.pasajero.id_persona,
        codigoReserva: r.codigo_reserva,
        pasajeroNombre: `${p.nombre} ${p.apellido}`,
        pasajeroDocumento: `${p.tipo_documento}: ${p.numero_documento}`,
        vueloId: r.vuelo.id_vuelo,
        vueloEstado: r.vuelo.estado,
        horaAbordaje: r.vuelo.hora_abordaje,
        salida: r.vuelo.fecha_hora_salida,
        llegada: r.vuelo.fecha_hora_llegada,
        origen: r.vuelo.id_origen,   // seguimos guardando IDs por si los usas
        destino: r.vuelo.id_destino,
        origenIata,          // 👈 valor calculado antes
        destinoIata, 
        checkInConfirmado: (ci?.estado_checkin ?? "").toLowerCase() === "confirmado",
        checkInEstado: ci?.estado_checkin ?? null,
        checkInFecha: ci?.fecha_hora ?? null,
        activa,
      });
    } finally {
      setLoading(false);
    }
  };

  // 👇 NUEVO: estado para validar equipaje antes de confirmar
const [equipajeReady, setEquipajeReady] = useState(false);
const [checkingEquipaje, setCheckingEquipaje] = useState(false);

// 👇 NUEVO: función que verifica si el equipaje está facturado y con maletas
const verificarEquipajeParaCheckin = async (idPasajero: number, idTicket?: number | null) => {
  setCheckingEquipaje(true);
  try {
    // Construye el query dinámicamente
    let query = supabase
      .from("equipaje")
      .select("id_equipaje, estado, cantidad")
      .eq("id_pasajero", idPasajero);

    if (idTicket) {
      query = query.eq("id_ticket", idTicket);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn("equipaje:", error.message);
      setEquipajeReady(false);
      return;
    }

    const ok =
      !!data &&
      (String(data.estado ?? "").toLowerCase() === "facturado") &&
      Number(data.cantidad ?? 0) > 0;

    setEquipajeReady(ok);
  } finally {
    setCheckingEquipaje(false);
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

  const navigate = useNavigate();

  // Si aún no guardas idTicket en "info", lo buscamos en la tabla pasajero
  const obtenerIdTicket = async (idPersona: number) => {
    const { data, error } = await supabase
      .from("pasajero")
      .select("id_ticket")
      .eq("id_persona", idPersona)
      .single();
    if (error) {
      console.warn("No se pudo leer id_ticket del pasajero:", error.message);
      return null;
    }
    return data?.id_ticket ?? null;
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
            <p>Origen/Destino: {info.origenIata ?? "N/D"} → {info.destinoIata ?? "N/D"}</p>

            <hr className="divider" />

            <p>
              <strong>Check‑In:</strong>{" "}
              {info.checkInConfirmado ? "Confirmado ✅" : (info.checkInEstado ?? "Sin registro")}
            </p>

            {!info.checkInConfirmado && (
              <div className="space-y-2">
                <button className="checkin-button" onClick={confirmarCheckIn} disabled={saving}>
                  {saving ? "Confirmando..." : "Confirmar Check‑In"}
                </button>
                {/* Botón para ir a Gestión de Equipaje */}
<button
  className="checkin-button"
  onClick={async () => {
    if (!info) return;
    // usa idTicket si ya lo guardas en info; si no, búscalo
    const idTicket = (info as any).idTicket ?? (await obtenerIdTicket(info.idPasajero));
    if (!idTicket) {
      alert("Este pasajero no tiene ticket asociado.");
      return;
    }
    navigate("/paginas/GestionEquipaje", {
      state: { idPersona: info.idPasajero, idTicket }
    });
  }}
>
  Gestionar equipaje
</button>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
