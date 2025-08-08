import React, { useState } from 'react';
import '../styles/comunicacion.css';
<<<<<<< HEAD
=======

>>>>>>> 80c6c09afc8a1000a0c604116c85930d22220836

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

  const manejarClickMapa = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Generar mensaje automático
    const mensajeCoordenadas = `📍 Emergencia marcada en coordenadas: X=${x}%, Y=${y}%`;
    setNuevoMensaje(mensajeCoordenadas);
  };

  return (
<<<<<<< HEAD
    <div className="comunicacion-container">
      <h1 className="comunicacion-titulo">Comunicación en Emergencia</h1>

      <div className="comunicacion-content">
        <div className="panel panel-mapa">
          <h3>Ubicación del Incidente</h3>
          <img
            src="/mapa_aeropuerto.png"
            alt="Mapa del aeropuerto"
            className="imagen-mapa"
            onClick={manejarClickMapa}
=======
    <div className="contenedor-comunicacion">
      <h1 className="titulo-comunicacion">Comunicación en Emergencia</h1>
{/*
      <div className="mapa-contenedor">
        <img src={mapa} alt="Mapa del aeropuerto" className="mapa-img" />
      </div>    */}

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
>>>>>>> 80c6c09afc8a1000a0c604116c85930d22220836
          />
        </div>

        <div className="panel panel-chat">
          <h3>Chat de Coordinación</h3>
          <div className="chat-mensajes">
            {mensajes.map((msg, index) => (
              <div
                key={index}
                className={`chat-mensaje ${msg.autor === 'Usuario' ? 'usuario' : 'operador'}`}
              >
                <strong>{msg.autor}:</strong> {msg.texto}
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
            />
            <button className="boton-enviar" onClick={enviarMensaje}>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComunicacionEmergencia;
