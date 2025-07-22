import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import logo from "../assets/logo1.svg";

export default function Login() {
  const [email, setEmail] = useState(localStorage.getItem('rememberEmail') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberEmail'));
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Si hay sesión activa, redirigir al dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg('');
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logo" />
      <h1>Login Aeropuerto</h1>
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
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          <label htmlFor="rememberMe">Recordar correo</label>
        </div>

        {errorMsg && <p className="error">{errorMsg}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
