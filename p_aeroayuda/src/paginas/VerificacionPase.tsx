import React, { useState } from 'react';
import '../styles/VerificacionPase.css';

type ResultadoVerificacion = 'coincide' | 'no coincide' | null;

export default function VerificacionPase() {
  const [codigoQR, setCodigoQR] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [resultado, setResultado] = useState<ResultadoVerificacion>(null);

  const manejarVerificacion = () => {
    if (codigoQR && nombre && tipoDocumento && numeroDocumento) {
      if (codigoQR === 'ABC123' && nombre === 'Juan Pérez') {
        setResultado('coincide');
      } else {
        setResultado('no coincide');
      }
    } else {
      alert('Por favor, completa todos los campos.');
    }
  };

  return (
    <div className="contenedor">
  <h1 className="titulo-verificacion">🔷 Verificación del Pase de Abordaje y Documentación</h1>
    <div className="contenedor-verificacion">
      

      <label>
        📷 Código QR / Código de Barras:
        <input
          type="text"
          placeholder="Escanea o escribe el código"
          value={codigoQR}
          onChange={(e) => setCodigoQR(e.target.value)}
          className="input-verificacion"
        />
      </label>

      <label>
        🧑 Nombre Completo:
        <input
          type="text"
          placeholder="Ej: Juan Pérez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="input-verificacion"
        />
      </label>

      <label>
        🪪 Tipo de Documento:
        <input
          type="text"
          placeholder="Ej: DNI, Pasaporte"
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value)}
          className="input-verificacion"
        />
      </label>

      <label>
        🔢 Número de Documento:
        <input
          type="text"
          placeholder="Ej: 001-2345678-9"
          value={numeroDocumento}
          onChange={(e) => setNumeroDocumento(e.target.value)}
          className="input-verificacion"
        />
      </label>

      <button onClick={manejarVerificacion} className="boton-verificar">
        ✅ Verificar
      </button>

      {resultado === 'coincide' && (
        <div className="resultado-ok">🟢 Coincide con el sistema ✅</div>
      )}
      {resultado === 'no coincide' && (
        <div className="resultado-error">🔴 No coincide con el sistema ❌</div>
      )}
    </div>
    </div>
  );
}
