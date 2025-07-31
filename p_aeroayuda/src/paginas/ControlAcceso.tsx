import React, { useState } from 'react';
import '../styles/controlAcceso.css';

type Resultadocontrol = 'coincide' | 'no coincide' | null;

export default function ControlAcceso() {
  const [codigoVuelo, setCodigoVuelo] = useState('');
  const [destino, setDestino] = useState('');
  const [estadoAutorizacion, setAutorizacion] = useState('');
  const [horaIngreso, setHoraIngreso] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  
  const [resultado, setResultado] = useState<Resultadocontrol>(null);

  const manejarcontrol = () => {
    if (codigoVuelo && numeroDocumento && tipoDocumento) {
      if (codigoVuelo === 'ABC123' && numeroDocumento === 'Juan Pérez') {
        setResultado('coincide');
      } else {
        setResultado('no coincide');
      }
    } else {
      alert('Por favor, completa todos los campos.');
    }
  };

  return (
    
        <>
      <div className="control-titulo-container">
        <h1 className="control-titulo-control">
          Control de Acceso
        </h1>
      </div>
<div className="control-contenedor">
            <div className="datos-contenedor">
          <label>
            <span className="control-etiqueta">Código de viaje</span>
            <input
              type="text"
              placeholder="Escribe el código"
              value={codigoVuelo}
              onChange={(e) => setCodigoVuelo(e.target.value)}
              className="control-input-control"
            />
          </label>

          <label>
            <span className="control-etiqueta">Tipo de Documento</span>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="control-input-control"
            >
              <option value="">Selecciona un tipo Documento</option>
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </label>

          <label>
            <span className="control-etiqueta">Número de Documento</span>
            <input
              type="text"
              placeholder="Ej: 001-2345678-9"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              className="control-input-control"
            />
          </label>
          
          <button onClick={manejarcontrol} className="control-boton-verificar">
            Verificar
          </button>
          </div>

          <div className='verificados-contenedor'>
<label>
            <span className="control-etiqueta">Destino del Vuelo</span>
            <input
              type="text"
              placeholder=""
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="control-input-control"
              readOnly
              disabled
            />
          </label>

<label>
            <span className="control-etiqueta">Hora de ingreso</span>
            <input
              type="text"
              placeholder=""
              value={horaIngreso}
              onChange={(e) => setHoraIngreso(e.target.value)}
              className="control-input-control"
              readOnly
              disabled
            />
          </label>

          <label>
            <span className="control-etiqueta">Estado de Autorización</span>
            <input
              type="text"
              placeholder=""
              value={horaIngreso}
              onChange={(e) => setHoraIngreso(e.target.value)}
              className="control-input-control"
              readOnly
              disabled
            />
          </label>

          <button onClick={manejarcontrol} className="control-boton-autorizar" disabled>
            Autorizar
          </button>
          </div>
</div>
          {resultado === 'coincide' && (
            <div className="control-resultado-ok">🟢 Coincide con el sistema ✅</div>
          )}
          {resultado === 'no coincide' && (
            <div className="control-resultado-error">🔴 No coincide con el sistema ❌</div>
          )}
        
      </>
    
  );
}
