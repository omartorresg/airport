import React, { useState } from 'react';
import { Input } from "../componentes/ui/input";
import { Button } from "../componentes/ui/button";
import { Card, CardContent } from "../componentes/ui/card";
import "../styles/checkin.css";
import { supabase } from '../SupabaseClient';

interface Pasajero {
  id: string;
  nombre: string;
  documento: string;
  asiento?: string;
  checkInConfirmado: boolean;
}

export default function CheckIn() {
  const [codigo, setCodigo] = useState("");
  const [pasajero, setPasajero] = useState<Pasajero | null>(null);
  const [asiento, setAsiento] = useState("");

  const buscarPasajero = async () => {
    const { data: reservas, error } = await supabase
      .from("reserva")
      .select(`
        id_reserva,
        codigo_reserva,
        pasajero (
          id_pasajero,
          persona (
            nombre,
            apellido,
            tipo_documento,
            numero_documento
          )
        )
      `)
      .eq("codigo_reserva", codigo)
      .single();
  
    if (error || !reservas || !reservas.pasajero) {
      alert("Reserva no encontrada.");
      return;
    }
  
    const persona = reservas.pasajero[0]?.persona[0];

    setPasajero({
      id: reservas.id_reserva.toString(),
      nombre: `${persona.nombre} ${persona.apellido}`,
      documento: `${persona.tipo_documento}: ${persona.numero_documento}`,
      checkInConfirmado: false, // puedes consultar si ya está hecho
    });
  };
  

  const confirmarCheckIn = () => {
    if (pasajero) {
      setPasajero({ ...pasajero, checkInConfirmado: true, asiento });
    }
  };

  return (
    <div className="checkin-container">
      <div className="checkin-card">
        <h1 className="checkin-title">Check-In de Pasajeros</h1>

        <input
          className="checkin-input"
          placeholder="Código de reserva o nombre"
          value={codigo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value)}
        />

        <button className="checkin-button" onClick={buscarPasajero}>
          Buscar
        </button>

        {pasajero && (
          <div className="passenger-info">
            <p><strong>Nombre:</strong> {pasajero.nombre}</p>
            <p><strong>Documento:</strong> {pasajero.documento}</p>
            <p><strong>Check-In:</strong> {pasajero.checkInConfirmado ? "✅ Confirmado" : "❌ No confirmado"}</p>

            {!pasajero.checkInConfirmado && (
              <div className="space-y-2">
                <input
                  className="checkin-input"
                  placeholder="Asiento (opcional)"
                  value={asiento}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAsiento(e.target.value)}
                />
                <button className="checkin-button" onClick={confirmarCheckIn}>
                  Confirmar Check-In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
