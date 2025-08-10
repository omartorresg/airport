import React, { useEffect, useRef, useState } from 'react';
import '../styles/comunicacion.css';

const ComunicacionEmergencia = () => {
  const [mensajes, setMensajes] = useState([
    { autor: 'Operador', texto: 'Ubique la emergencia en el mapa, por favor.' },
    { autor: 'Usuario', texto: 'Está ocurriendo cerca de la pista principal.' },
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const enviarMensaje = () => {
    if (!nuevoMensaje.trim()) return;
    setMensajes(prev => [...prev, { autor: 'Usuario', texto: nuevoMensaje }]);
    setNuevoMensaje('');
  };

  const manejarClickMapa = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setNuevoMensaje(`📍 Emergencia marcada en coordenadas: X=${x}%, Y=${y}%`);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensajes]);

  return (
    <div className="comunicacion-container">
      <h1 className="comunicacion-titulo">Comunicación en Emergencia</h1>

      <div className="comunicacion-content">
        {/* Panel Mapa */}
        <div className="panel panel-mapa">
          <h3>Ubicación del Incidente</h3>
          <img
            src="/mapa_aeropuerto.png"
            alt="Mapa del aeropuerto"
            className="imagen-mapa"
            onClick={manejarClickMapa}
          />
        </div>

        {/* Panel Chat */}
        <div className="panel panel-chat">
          <h3>Chat de Coordinación</h3>

          <div className="chat-mensajes" ref={chatRef}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`chat-mensaje ${m.autor === 'Usuario' ? 'usuario' : 'operador'}`}
              >
                <div className="chat-autor">{m.autor}</div>
                <div className="chat-texto">{m.texto}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="input-chat"
              placeholder="Escriba su mensaje..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
            />
            <button className="boton-enviar" onClick={enviarMensaje}>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComunicacionEmergencia;
