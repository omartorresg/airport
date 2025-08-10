import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/userIcon.css';

export default function IconoAlerta() {
  const navigate = useNavigate();

  return (
    <div className="icono-alerta-fijo" onClick={() => navigate('/protocolo')}>
      <img src="/user.svg" alt="Alerta" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
