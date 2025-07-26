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
    <div className="verificacion-contenedor">
      <div className="verificacion-titulo-container">
        <h1 className="verificacion-titulo-verificacion">
          Verificación del Pase <br /> de Abordaje y Documentación
        </h1>
      </div>

     
        <div className="verificacion-contenedor-verificacion">
          <label>
            <span className="verificacion-etiqueta">Código QR / Barras</span>
            <input
              type="text"
              placeholder="Escanea o escribe el código"
              value={codigoQR}
              onChange={(e) => setCodigoQR(e.target.value)}
              className="verificacion-input-verificacion"
            />
          </label>

          <label>
            <span className="verificacion-etiqueta">Nombre Completo</span>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="verificacion-input-verificacion"
            />
          </label>

          <label>
            <span className="verificacion-etiqueta">Tipo de Documento</span>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="verificacion-input-verificacion"
            >
              <option value="">Selecciona un tipo Documento</option>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </label>

          <label>
            <span className="verificacion-etiqueta">Número de Documento</span>
            <input
              type="text"
              placeholder="Ej: 001-2345678-9"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              className="verificacion-input-verificacion"
            />
          </label>

          <button onClick={manejarVerificacion} className="verificacion-boton-verificar">
            Verificar
          </button>

          {resultado === 'coincide' && (
            <div className="verificacion-resultado-ok">🟢 Coincide con el sistema ✅</div>
          )}
          {resultado === 'no coincide' && (
            <div className="verificacion-resultado-error">🔴 No coincide con el sistema ❌</div>
          )}
        </div>
      </div>
    
  );
}
