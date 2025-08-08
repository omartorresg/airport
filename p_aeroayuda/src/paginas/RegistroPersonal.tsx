import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import { hash as bcryptHash } from 'bcryptjs';
import '../styles/registroPersonal.css';

interface Departamento { id_departamento: number; nombre: string; }
interface Rol { id_rol: number; nombre_rol: string; }
type Estado = 'activo' | 'inactivo';

export default function RegistrarPersonal() {
  const [nombre, setNombre] = useState('');
  const [documentoId, setDocumentoId] = useState('');
  const [estado, setEstado] = useState<Estado>('activo');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [idDepartamento, setIdDepartamento] = useState('');
  const [idRol, setIdRol] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emails, setEmails] = useState([{ email: '', tipo: 'laboral', es_principal: true }]);
  const [telefonos, setTelefonos] = useState([{ numero: '', tipo: 'móvil', es_principal: true }]);

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data: deps } = await supabase.from('departamentos').select('id_departamento,nombre').order('nombre');
      const { data: r } = await supabase.from('roles').select('id_rol,nombre_rol').order('nombre_rol');
      setDepartamentos(deps || []);
      setRoles(r || []);
    };
    cargar();
  }, []);

  // --- Emails ---
  const addEmail = () => setEmails(prev => [...prev, { email: '', tipo: 'laboral', es_principal: false }]);
  const removeEmail = (i: number) => {
    if (emails.length <= 1) return;
    setEmails(prev => {
      const removedWasPrincipal = prev[i].es_principal;
      const arr = prev.filter((_, idx) => idx !== i);
      if (arr.length && removedWasPrincipal && !arr.some(x => x.es_principal)) arr[0].es_principal = true;
      return [...arr];
    });
  };
  const updateEmailValue = (i: number, key: 'email'|'tipo', val: string) =>
    setEmails(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  const setPrincipalEmail = (i: number) =>
    setEmails(prev => prev.map((e, idx) => ({ ...e, es_principal: idx === i })));

  // --- Teléfonos ---
  const addTelefono = () => setTelefonos(prev => [...prev, { numero: '', tipo: 'móvil', es_principal: false }]);
  const removeTelefono = (i: number) => {
    if (telefonos.length <= 1) return;
    setTelefonos(prev => {
      const removedWasPrincipal = prev[i].es_principal;
      const arr = prev.filter((_, idx) => idx !== i);
      if (arr.length && removedWasPrincipal && !arr.some(x => x.es_principal)) arr[0].es_principal = true;
      return [...arr];
    });
  };
  const updateTelefonoValue = (i: number, key: 'numero'|'tipo', val: string) =>
    setTelefonos(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
  const setPrincipalTelefono = (i: number) =>
    setTelefonos(prev => prev.map((t, idx) => ({ ...t, es_principal: idx === i })));

  // --- Validaciones ---
  const validarEmails = () => emails.every(e => e.email.trim() && e.email.includes('@'));
  const validar = () => {
    if (!nombre.trim() || !documentoId.trim() || !idDepartamento || !idRol) return 'Completa nombre, documento, departamento y rol.';
    if (!password || password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!validarEmails()) return 'Todos los emails deben ser válidos y contener "@".';
    if (telefonos.some(t => !t.numero.trim())) return 'Hay teléfonos vacíos. Elimina o complétalos.';
    if (!emails.some(e => e.es_principal)) return 'Debes seleccionar un email principal.';
    if (!telefonos.some(t => t.es_principal)) return 'Debes seleccionar un teléfono principal.';
    return '';
  };

  // --- Registro ---
  const registrar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMensaje('');
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    // dividir nombre → nombre y resto como apellido
    const partes = nombre.trim().split(/\s+/);
    const nombrePersona = partes[0] || '';
    const apellidoPersona = partes.slice(1).join(' ');

    // Guardaremos IDs para poder limpiar si algo falla
    let id_persona: number | null = null;
    let id_personal: number | null = null;

    try {
      // 1) Insertar en persona
      const { data: personaData, error: personaErr } = await supabase
        .from('persona')
        .insert({
          nombre: nombrePersona,
          apellido: apellidoPersona || '',
          tipo_documento: 'DNI',
          numero_documento: documentoId
        })
        .select('id_persona')
        .single();

      if (personaErr || !personaData) throw new Error(personaErr?.message || 'No se pudo crear persona');
      id_persona = personaData.id_persona;

      // 2) Insertar en personal_operativo **sin** id_personal (lo genera la secuencia)
      const { data: personalData, error: personalErr } = await supabase
        .from('personal_operativo')
        .insert({
          // id_personal: id_persona,  ❌ NO mandamos PK manualmente
          nombre,
          documento_id: documentoId,
          estado,
          fecha_ingreso: fechaIngreso || null,
          id_departamento: parseInt(idDepartamento),
          id_rol: parseInt(idRol)
        })
        .select('id_personal')
        .single();

      if (personalErr || !personalData) throw new Error(personalErr?.message || 'No se pudo crear personal_operativo');
      id_personal = personalData.id_personal;

      // 3) Insertar emails (tabla existente por id_persona)
      if (emails.length) {
        const payloadEmails = emails.map(e => ({
          id_persona,
          email: e.email,
          tipo: e.tipo || null,
          es_principal: !!e.es_principal
        }));
        const { error } = await supabase.from('emails').insert(payloadEmails);
        if (error) throw new Error('Emails: ' + error.message);
      }

      // 4) Insertar teléfonos (tabla existente por id_persona)
      if (telefonos.length) {
        const payloadTels = telefonos.map(t => ({
          id_persona,
          numero: t.numero,
          tipo: t.tipo || null,
          es_principal: !!t.es_principal
        }));
        const { error } = await supabase.from('telefonos').insert(payloadTels);
        if (error) throw new Error('Teléfonos: ' + error.message);
      }

      // 5) Crear usuario login
      const emailPrincipal = (emails.find(e => e.es_principal) || emails[0]).email;
      const password_hash = await bcryptHash(password, 10);

      const { error: e4 } = await supabase.from('usuarios_login').insert({
        email: emailPrincipal,
        password_hash,
        id_personal, // usamos la PK generada por personal_operativo
        id_rol: parseInt(idRol),
        estado: 'activo'
      });

      if (e4) throw new Error('Usuario login: ' + e4.message);

      setMensaje('✅ Personal y usuario creados con éxito.');
      // limpiar
      setNombre(''); setDocumentoId(''); setEstado('activo'); setFechaIngreso(''); setIdDepartamento(''); setIdRol('');
      setPassword('');
      setEmails([{ email: '', tipo: 'laboral', es_principal: true }]);
      setTelefonos([{ numero: '', tipo: 'móvil', es_principal: true }]);

    } catch (err: any) {
      // Limpieza si algo falló después de crear persona / personal
      console.error('Error en registro:', err?.message || err);

      // intenta cleanup en orden inverso
      if (id_personal) {
        await supabase.from('usuarios_login').delete().eq('id_personal', id_personal);
        await supabase.from('personal_operativo').delete().eq('id_personal', id_personal);
      }
      if (id_persona) {
        await supabase.from('emails').delete().eq('id_persona', id_persona);
        await supabase.from('telefonos').delete().eq('id_persona', id_persona);
        await supabase.from('persona').delete().eq('id_persona', id_persona);
      }

      setMensaje('❌ Error al registrar: ' + (err?.message || 'Desconocido'));
    }
  };

  return (
    <>
      <div className="titulo-clasificacion"><h1>Registrar Personal</h1></div>

      <div className="contenedor-clasi">
        <form className="contenedor-clasificacion registrar-personal" onSubmit={registrar}>
          <h2 className="subtitulo">Datos del Personal</h2>

          <label>
            <span className="etiqueta">Nombre completo</span>
            <input className="input-clasificacion" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Ana Pérez" />
          </label>

          <label>
            <span className="etiqueta">Documento ID</span>
            <input className="input-clasificacion" value={documentoId} onChange={e=>setDocumentoId(e.target.value)} placeholder="Ej: 001-1234567-8" />
          </label>

          <label>
            <span className="etiqueta">Departamento</span>
            <select className="input-clasificacion" value={idDepartamento} onChange={e=>setIdDepartamento(e.target.value)}>
              <option value="">Seleccione</option>
              {departamentos.map(d => <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Rol</span>
            <select className="input-clasificacion" value={idRol} onChange={e=>setIdRol(e.target.value)}>
              <option value="">Seleccione</option>
              {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Estado</span>
            <select className="input-clasificacion" value={estado} onChange={e=>setEstado(e.target.value as Estado)}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </label>

          <label>
            <span className="etiqueta">Fecha de Ingreso</span>
            <input className="input-clasificacion" type="date" value={fechaIngreso} onChange={e=>setFechaIngreso(e.target.value)} />
          </label>

          <label>
            <span className="etiqueta">Contraseña (para el usuario)</span>
            <input
              className="input-clasificacion"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <label className="mostrar-pass">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <span className="mostrar-pass__texto">Mostrar contraseña</span>
            </label>
          </label>

          {/* Emails */}
          <div className="panel panel-contacto">
            <h3>Emails</h3>
            {emails.map((e, i) => (
              <div className="fila-contacto" key={`email-${i}`}>
                <input
                  className="input-clasificacion"
                  type="email"
                  placeholder="email@empresa.com"
                  value={e.email}
                  onChange={ev=>updateEmailValue(i,'email',ev.target.value)}
                />
                <select
                  className="input-clasificacion"
                  value={e.tipo}
                  onChange={ev=>updateEmailValue(i,'tipo',ev.target.value)}
                >
                  <option value="laboral">laboral</option>
                  <option value="personal">personal</option>
                  <option value="otro">otro</option>
                </select>

                <label className="chk">
                  <input
                    type="radio"
                    name="email-principal"
                    checked={e.es_principal}
                    onChange={() => setPrincipalEmail(i)}
                  />
                  Principal
                </label>

                {emails.length > 1 && (
                  <button className="btn-mini eliminar" type="button" onClick={()=>removeEmail(i)}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button className="btn-mini agregar" type="button" onClick={addEmail}>+ Añadir email</button>
          </div>

          {/* Teléfonos */}
          <div className="panel panel-contacto">
            <h3>Teléfonos</h3>
            {telefonos.map((t, i) => (
              <div className="fila-contacto" key={`tel-${i}`}>
                <input
                  className="input-clasificacion"
                  placeholder="+1 809 555 0000"
                  value={t.numero}
                  onChange={ev=>updateTelefonoValue(i,'numero',ev.target.value)}
                />
                <select
                  className="input-clasificacion"
                  value={t.tipo}
                  onChange={ev=>updateTelefonoValue(i,'tipo',ev.target.value)}
                >
                  <option value="móvil">móvil</option>
                  <option value="casa">casa</option>
                  <option value="oficina">oficina</option>
                  <option value="otro">otro</option>
                </select>

                <label className="chk">
                  <input
                    type="radio"
                    name="telefono-principal"
                    checked={t.es_principal}
                    onChange={() => setPrincipalTelefono(i)}
                  />
                  Principal
                </label>

                {telefonos.length > 1 && (
                  <button className="btn-mini eliminar" type="button" onClick={()=>removeTelefono(i)}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button className="btn-mini agregar" type="button" onClick={addTelefono}>+ Añadir teléfono</button>
          </div>

          <button type="submit" className="boton-verificar ancho-total">Registrar Personal</button>

          {mensaje && <div className="resultado-ok">{mensaje}</div>}
        </form>
      </div>
    </>
  );
}
