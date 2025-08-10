import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import logo from '../assets/logo1.svg';
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

    // Buscar el usuario por correo
    const { data: user, error: userError } = await supabase
      .from('usuarios_login')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      setError('Correo no encontrado');
      setLoading(false);
      return;
    }

    // Verificar contraseña
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

    // Obtener nombre del rol desde tabla `roles`
    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('nombre_rol')
      .eq('id_rol', user.id_rol)
      .single();

    if (rolError || !rolData) {
      setError('No se pudo obtener el rol del usuario');
      setLoading(false);
      return;
    }

    const nombreRol = rolData.nombre_rol.toLowerCase();
    console.log('Rol obtenido:', nombreRol);

    // Guardar sesión
    localStorage.setItem('usuario', JSON.stringify(user));
    if (rememberMe) {
      localStorage.setItem('emailRecordado', email);
    } else {
      localStorage.removeItem('emailRecordado');
    }

    // Redirección según el rol
    console.log(nombreRol)
    switch (nombreRol) {
      case 'administrador':
        navigate('/admin');
        break;
      case 'seguridad':
        navigate('/paginas/ControlSeguridad');
        break;
      case 'atencion':
        navigate('/paginas/AtencionUsuario');
        break;
      case 'emergencias':
        navigate('/paginas/GestionEmergencias');
        break;
      default:
        navigate('/paginas/Tablero');
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
