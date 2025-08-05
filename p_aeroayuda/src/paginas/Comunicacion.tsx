import React, { useState } from 'react';
import '../styles/comunicacion.css';
import mapa from '../assets/mapa_aeropuerto.png';

const ComunicacionEmergencia = () => {
  const [mensajes, setMensajes] = useState([
    { autor: 'Operador', texto: 'Ubique la emergencia en el mapa, por favor.' },
    { autor: 'Usuario', texto: 'Está ocurriendo cerca de la pista principal.' },
  ]);

  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const enviarMensaje = () => {
    if (nuevoMensaje.trim() !== '') {
      setMensajes([...mensajes, { autor: 'Usuario', texto: nuevoMensaje }]);
      setNuevoMensaje('');
    }
  };

  return (
    <div className="contenedor-comunicacion">
      <h1 className="titulo-comunicacion">Comunicación en Emergencia</h1>

      <div className="mapa-contenedor">
        <img src={mapa} alt="Mapa del aeropuerto" className="mapa-img" />
      </div>

      <div className="chat-contenedor">
        <div className="chat-mensajes">
          {mensajes.map((msg, index) => (
            <div
              key={index}
              className={`mensaje ${msg.autor === 'Usuario' ? 'mensaje-usuario' : 'mensaje-operador'}`}
            >
              <strong>{msg.autor}:</strong> {msg.texto}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Escriba su mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
          />
          <button onClick={enviarMensaje}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default ComunicacionEmergencia;
