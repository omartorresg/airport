// src/index.tsx (o src/main.tsx)
import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/General.css'; // opcional: estilos globales
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './rutas/AppRoutes';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</React.StrictMode>,
);
