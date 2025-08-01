import React, { useState, useEffect } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/VerificacionPase.css';

type ResultadoVerificacion = 'coincide' | 'no coincide' | null;

export default function VerificacionPase() {
  const [codigoQR, setCodigoQR] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [resultado, setResultado] = useState<ResultadoVerificacion>(null);

  const equivalencias: Record<string, string> = {
    DNI: 'cédula',
    Cédula: 'cédula',
    Pasaporte: 'pasaporte'
  };

  const manejarVerificacion = async () => {
    if (!codigoQR || !nombre || !tipoDocumento || !numeroDocumento) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    // Normalizamos los datos de entrada
    const nombreInput = nombre.trim().toLowerCase();
    const tipoDocInput = equivalencias[tipoDocumento.trim()]?.toLowerCase();
    const numDocInput = numeroDocumento.trim();

    // Buscar el pasajero por id_ticket
    const { data: pasajeros, error: errorPasajero } = await supabase
      .from('pasajero')
      .select('id_persona')
      .eq('id_ticket', parseInt(codigoQR));

    if (errorPasajero || !pasajeros || pasajeros.length === 0) {
      setResultado('no coincide');
      return;
    }

    const idPersona = pasajeros[0].id_persona;

    // Buscar persona relacionada
    const { data: personas, error: errorPersona } = await supabase
      .from('persona')
      .select('*')
      .eq('id_persona', idPersona);

    if (errorPersona || !personas || personas.length === 0) {
      setResultado('no coincide');
      return;
    }

    const persona = personas[0];
    const nombreCompletoBD = `${persona.nombre}${persona.apellido}`.trim().toLowerCase();
    const tipoDocumentoBD = equivalencias[persona.tipo_documento.trim()]?.toLowerCase();
    const numeroDocumentoBD = persona.numero_documento.trim();

    // Comparación
    if (
      nombreInput === nombreCompletoBD &&
      tipoDocInput === tipoDocumentoBD &&
      numDocInput === numeroDocumentoBD
    ) {
      setResultado('coincide');
    } else {
      setResultado('no coincide');
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
          <span className="verificacion-etiqueta">Código QR / Barras (ID Ticket)</span>
          <input
            type="text"
            placeholder="Ej: 1"
            value={codigoQR}
            onChange={(e) => setCodigoQR(e.target.value)}
            className="verificacion-input-verificacion"
          />
        </label>

        <label>
          <span className="verificacion-etiqueta">Nombre Completo</span>
          <input
            type="text"
            placeholder="Ej: Luis Garcia"
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
            <option value="Cédula">Cédula</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </label>

        <label>
          <span className="verificacion-etiqueta">Número de Documento</span>
          <input
            type="text"
            placeholder="Ej: 00112345678"
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
