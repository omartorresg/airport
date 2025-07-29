import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import logo from "../assets/logo1.svg";
import { supabase } from '../SupabaseClient';
import bcrypt from 'bcryptjs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const recordado = localStorage.getItem('emailRecordado');
    if (recordado) {
      setEmail(recordado);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Buscar usuario + rol
    console.log("Email ingresado:", email);
   const { data: user, error: fetchError } = await supabase
     .from('usuarios_login')
    .select('*') // o 'email, password_hash, estado, id_rol'
    .eq('email', email)
    .single();

    if (fetchError || !user) {
      setError('Correo no encontrado');
      setLoading(false);
      return;
    }


    //ver que rol tiene el usuario
    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('nombre_rol')
      .eq('id_rol', user.id_rol)
      .single();
    
      const Rol = rolData?.nombre_rol?.toLowerCase();
      console.log("Rol obtenido2:", Rol);


    // 2. Verificar contraseña
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      setError('Contraseña incorrecta');
      setLoading(false);
      return;
    }

    if (user.estado !== 'activo') {
      setError('Usuario inactivo o bloqueado');
      setLoading(false);
      return;
    }

    // 3. Guardar sesión
    localStorage.setItem('usuario', JSON.stringify(user));
    if (rememberMe) {
      localStorage.setItem('emailRecordado', email);
    } else {
      localStorage.removeItem('emailRecordado');
    }

    // 4. Redirección dinámica según nombre del rol
    console.log("Rol obtenido:", Rol);

    switch (Rol) {
      case 'administrador':
        navigate('/paginas/ControlSeguridad');
        break;
      case 'seguridad':
        navigate('/ControlSeguridad');
        break;
      case 'atencion':
        navigate('/paginas/AtencionUsuario');
        break;
      case 'emergencias':
        navigate('/paginas/GestionEmergencias');
        break;
      default:
        navigate('/Checkin');
    }

    setLoading(false);
  };

  return (
    <>
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      <div className="login-container">
        <h1>¡Bienvenido!</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="remember-me">
            <label htmlFor="rememberMe" className="left-side">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Recordar cuenta
            </label>
            <a href="#" className="right-side">¿Olvidaste la contraseña?</a>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </form>
      </div>
    </>
  );
}
