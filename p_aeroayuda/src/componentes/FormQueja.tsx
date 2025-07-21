// src/paginas/Quejas.tsx
import React from 'react';
import FormQueja from '../componentes/FormQueja';
import '../styles/FormQueja.css';

export default function Quejas() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>📣 Módulo de Quejas</h2>
      <FormQueja />
    </div>
  );
}

