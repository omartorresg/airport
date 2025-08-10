import React, { useState } from "react";
import { supabase } from "../SupabaseClient";
import "../styles/GeneracionPasesAbordaje.css";

export default function PaseAbordaje() {
  const [idTicket, setIdTicket] = useState("");
  const [boleto, setBoleto] = useState<any>(null);

  const buscarTicket = async () => {
    const { data, error } = await supabase
      .from("ticket")
      .select(`
        *,
        vuelo (origen, destino, fecha_hora_salida, hora_abordaje),
        pasajero (id_persona, persona (nombre, apellido))
      `)
      .eq("id_ticket", idTicket)
      .single();

    if (error) {
      alert("No se encontró el ticket.");
    } else {
      setBoleto(data);
    }
  };

  return (
  <div className="pagina-pase">
    <div className="pase-abordaje-container">
      <h2>Generar Pase de Abordaje</h2>
      <input
        placeholder="Ingrese ID del Ticket"
        value={idTicket}
        onChange={(e) => setIdTicket(e.target.value)}
      />
      <button onClick={buscarTicket}>Buscar y Generar</button>

      {boleto && (
        <div className="pase">
          <h3>Pase de Abordaje</h3>
          <p>
            Pasajero: {boleto.pasajero.persona.nombre}{" "}
            {boleto.pasajero.persona.apellido}
          </p>
          <p>Origen: {boleto.vuelo.origen}</p>
          <p>Destino: {boleto.vuelo.destino}</p>
          <p>Hora Abordaje: {boleto.vuelo.hora_abordaje}</p>
          <p>Salida: {boleto.vuelo.fecha_hora_salida}</p>
        </div>
      )}
    </div>
  </div>
);

}
