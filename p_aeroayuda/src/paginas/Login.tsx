import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { supabase } from '../SupabaseClient';
import '../styles/Login.css';
import logo from '../assets/logo1.svg';

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

<<<<<<< HEAD
    // Buscar el usuario por correo
    const { data: user, error: userError } = await supabase
=======
    // 1. Buscar el usuario por correo
    const { data: user, error: fetchError } = await supabase
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
      .from('usuarios_login')
      .select('*')
      .eq('email', email)
      .single();

<<<<<<< HEAD
    if (userError || !user) {
=======
    if (fetchError || !user) {
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
      setError('Correo no encontrado');
      setLoading(false);
      return;
    }

<<<<<<< HEAD
    // Verificar contraseña
=======
    // 2. Verificar la contraseña hasheada
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      setError('Contraseña incorrecta');
      setLoading(false);
      return;
    }

<<<<<<< HEAD
=======
    // 3. Validar estado del usuario
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
    if (user.estado !== 'activo') {
      setError('Usuario inactivo o bloqueado');
      setLoading(false);
      return;
    }

<<<<<<< HEAD
    // Obtener nombre del rol desde tabla `roles`
=======
    // 4. Obtener el nombre del rol desde la tabla roles
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('nombre_rol')
      .eq('id_rol', user.id_rol)
      .single();

    if (rolError || !rolData) {
<<<<<<< HEAD
      setError('No se pudo obtener el rol del usuario');
=======
      setError('Error al obtener el rol');
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
      setLoading(false);
      return;
    }

    const nombreRol = rolData.nombre_rol.toLowerCase();
<<<<<<< HEAD
    console.log('Rol obtenido:', nombreRol);

    // Guardar sesión
=======
    console.log("Rol obtenido:", nombreRol);

    // 5. Guardar sesión
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
    localStorage.setItem('usuario', JSON.stringify(user));
    if (rememberMe) {
      localStorage.setItem('emailRecordado', email);
    } else {
      localStorage.removeItem('emailRecordado');
    }

<<<<<<< HEAD
    // Redirección según el rol
    console.log(nombreRol)
    switch (nombreRol) {
      case 'administrador':
        navigate('/admin');
=======
    // 6. Redirigir según el rol
    console.log("Redirigiendo a:", nombreRol);
    switch (nombreRol) {
      case 'administrador':
        navigate('/paginas/Tablero');
>>>>>>> 5efddf9c3dfa53e4a8a5a4f232b5a8914b3c3311
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
            <span className="right-side" style={{ fontSize: '14px', color: '#888' }}>
              ¿Olvidaste la contraseña?
            </span>
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
      