import React, { useState } from 'react';

export default function ControlSeguridad() {
  const [nombre, setNombre] = useState('');

  const manejarClick = () => {
    alert(`Hola, ${nombre}!`);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>Bienvenido a mi interfaz</h1>
      <input
        type="text"
        placeholder="Escribe tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={{ padding: '8px', fontSize: '16px', marginRight: '10px' }}
      />
      <button onClick={manejarClick} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Saludar
      </button>
    </div>
  );
}
