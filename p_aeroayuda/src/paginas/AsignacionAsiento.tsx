import React, { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/AsignacionAsientos.css";

interface Asiento {
  id_asiento: number;
  codigo_asiento: string;
}

export default function AsignarAsiento() {
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [vueloId, setVueloId] = useState("");
  const [pasajeroId, setPasajeroId] = useState("");
  const [asientoId, setAsientoId] = useState("");

  const asignarAsiento = async () => {
    // Validación previa
    const { data: ticketsExistentes, error: errorConsulta } = await supabase
      .from("ticket")
      .select("id_ticket")
      .eq("id_vuelo", parseInt(vueloId))
      .in("id_ticket", [supabase.from("pasajero").select("id_ticket").eq("id_pasajero", parseInt(pasajeroId))]);

    if (errorConsulta) {
      alert("Error al verificar ticket existente: " + errorConsulta.message);
      return;
    }

    if (ticketsExistentes.length > 0) {
      alert("Este pasajero ya tiene un asiento asignado para este vuelo.");
      return;
    }

    // Insertar nuevo ticket
    const { data, error } = await supabase.from("ticket").insert([
      {
        id_vuelo: parseInt(vueloId),
        id_asiento: parseInt(asientoId),
        estado: "asignado",
        fecha_compra: new Date().toISOString().split("T")[0],
      },
    ]);

    if (error) {
      alert("Error asignando asiento: " + error.message);
    } else {
      alert("Asiento asignado correctamente.");
    }
  };

  useEffect(() => {
    const cargarAsientos = async () => {
      const { data, error } = await supabase.from("asiento").select("*");
      if (data) {
        setAsientos(data as Asiento[]);
      } else {
        console.error("Error al cargar asientos:", error?.message);
      }
    };
    cargarAsientos();
  }, []);

  return (
    <div className="asignar-asiento-container">
      <h2>Asignación de Asiento</h2>

      <label>ID del Vuelo</label>
      <input
        type="number"
        value={vueloId}
        onChange={(e) => setVueloId(e.target.value)}
        placeholder="Ej: 3"
      />

      <label>ID del Pasajero</label>
      <input
        type="number"
        value={pasajeroId}
        onChange={(e) => setPasajeroId(e.target.value)}
        placeholder="Ej: 12"
      />

      <label>Seleccione Asiento</label>
      <select
        value={asientoId}
        onChange={(e) => setAsientoId(e.target.value)}
      >
        <option value="">-- Asientos Disponibles --</option>
        {asientos.map((a) => (
          <option key={a.id_asiento} value={a.id_asiento}>
            {a.codigo_asiento}
          </option>
        ))}
      </select>

      <button onClick={asignarAsiento}>Asignar Asiento</button>
    </div>
  );
}
