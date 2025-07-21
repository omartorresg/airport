import React, { useState } from 'react';
import { Input } from "../componentes/ui/input";
import { Button } from "../componentes/ui/button";
import { Card, CardContent } from "../componentes/ui/card";
import "../styles/checkin.css";


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

  const buscarPasajero = () => {
    setPasajero({
      id: "AB123",
      nombre: "Juan Pérez",
      documento: "123456789",
      checkInConfirmado: false,
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
        <h1>Check-In de Pasajeros</h1>

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
                <button
                  className="checkin-button"
                  onClick={confirmarCheckIn}
                >
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
