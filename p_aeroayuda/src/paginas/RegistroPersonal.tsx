import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../SupabaseClient';
import { hash as bcryptHash } from 'bcryptjs';
import '../styles/registroPersonal.css';

interface Departamento { id_departamento: number; nombre: string; }
interface Rol { id_rol: number; nombre_rol: string; }
type Estado = 'activo' | 'inactivo';

interface RowListado {
  id_personal: number;
  nombre: string;
  documento_id: string;
  estado: string;
  fecha_ingreso: string | null;
  id_departamento: number;
  id_rol: number;
  dep_nombre?: string;
  rol_nombre?: string;
}

export default function RegistrarPersonal() {
  // Form
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

  // Catálogos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);

  // Mensaje / selección
  const [mensaje, setMensaje] = useState('');
  const [seleccionIdPersonal, setSeleccionIdPersonal] = useState<number | null>(null);
  const [seleccionIdPersona, setSeleccionIdPersona] = useState<number | null>(null); // resuelto por documento

  // Listado + filtros
  const [listado, setListado] = useState<RowListado[]>([]);
  const [filtro, setFiltro] = useState({ nombre: '', documento: '', departamento: '', rol: '', estado: '' });

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data: deps } = await supabase.from('departamentos').select('id_departamento,nombre').order('nombre');
      const { data: r } = await supabase.from('roles').select('id_rol,nombre_rol').order('nombre_rol');
      setDepartamentos(deps || []);
      setRoles(r || []);
      await cargarListado();
    };
    cargar();
  }, []);

  const cargarListado = async () => {
    const { data, error } = await supabase
      .from('personal_operativo')
      .select(`
        id_personal, nombre, documento_id, estado, fecha_ingreso, id_departamento, id_rol,
        departamentos:departamentos (nombre),
        roles:roles (nombre_rol)
      `)
      .order('id_personal', { ascending: false });

    if (!error && data) {
      const rows = (data as any[]).map(r => ({
        id_personal: r.id_personal,
        nombre: r.nombre,
        documento_id: r.documento_id,
        estado: r.estado,
        fecha_ingreso: r.fecha_ingreso,
        id_departamento: r.id_departamento,
        id_rol: r.id_rol,
        dep_nombre: r.departamentos?.nombre || '',
        rol_nombre: r.roles?.nombre_rol || ''
      })) as RowListado[];
      setListado(rows);
    }
  };

  // -------- Emails --------
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

  // -------- Teléfonos --------
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

  // -------- Validaciones --------
  const validarEmails = () => emails.every(e => e.email.trim() && e.email.includes('@'));
  const validar = () => {
    if (!nombre.trim() || !documentoId.trim() || !idDepartamento || !idRol) return 'Completa nombre, documento, departamento y rol.';
    if (seleccionIdPersonal === null && (!password || password.length < 6)) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (!validarEmails()) return 'Todos los emails deben ser válidos y contener "@".';
    if (telefonos.some(t => !t.numero.trim())) return 'Hay teléfonos vacíos. Elimina o complétalos.';
    if (!emails.some(e => e.es_principal)) return 'Debes seleccionar un email principal.';
    if (!telefonos.some(t => t.es_principal)) return 'Debes seleccionar un teléfono principal.';
    return '';
  };

  // -------- Aux: obtener id_persona por documento --------
  const obtenerIdPersonaPorDocumento = async (doc: string): Promise<number | null> => {
    const { data, error } = await supabase
      .from('persona')
      .select('id_persona')
      .eq('numero_documento', doc)
      .maybeSingle();
    if (error) return null;
    return data?.id_persona ?? null;
  };

  // -------- Registrar --------
  const registrar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMensaje('');
    if (seleccionIdPersonal !== null) {
      setMensaje('❌ Estás en modo edición. Limpia el formulario o usa “Modificar”.');
      return;
    }
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    // No permitir duplicado de documento
    const { data: exists } = await supabase
      .from('personal_operativo')
      .select('id_personal')
      .eq('documento_id', documentoId)
      .maybeSingle();
    if (exists) { setMensaje('❌ Ya existe un personal con ese Documento ID.'); return; }

    // Nombre → nombre/apellido
    const partes = nombre.trim().split(/\s+/);
    const nombrePersona = partes[0] || '';
    const apellidoPersona = partes.slice(1).join(' ');

    // IDs para revertir en error
    let id_persona: number | null = null;
    let id_personal: number | null = null;

    try {
      // 1) persona
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

      // 2) personal_operativo
      const { data: personalData, error: personalErr } = await supabase
        .from('personal_operativo')
        .insert({
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

      // 3) emails
      if (emails.length) {
        const payloadEmails = emails.map(e => ({ id_persona, email: e.email, tipo: e.tipo || null, es_principal: !!e.es_principal }));
        const { error } = await supabase.from('emails').insert(payloadEmails);
        if (error) throw new Error('Emails: ' + error.message);
      }

      // 4) telefonos
      if (telefonos.length) {
        const payloadTels = telefonos.map(t => ({ id_persona, numero: t.numero, tipo: t.tipo || null, es_principal: !!t.es_principal }));
        const { error } = await supabase.from('telefonos').insert(payloadTels);
        if (error) throw new Error('Teléfonos: ' + error.message);
      }

      // 5) usuario login
      const emailPrincipal = (emails.find(e => e.es_principal) || emails[0]).email;
      const password_hash = await bcryptHash(password, 10);
      const { error: e4 } = await supabase.from('usuarios_login').insert({
        email: emailPrincipal,
        password_hash,
        id_personal,
        id_rol: parseInt(idRol),
        estado: 'activo'
      });
      if (e4) throw new Error('Usuario login: ' + e4.message);

      setMensaje('✅ Personal y usuario creados con éxito.');
      await cargarListado();
      limpiarFormulario();

    } catch (err: any) {
      // cleanup
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

  const limpiarFormulario = () => {
    setNombre('');
    setDocumentoId('');
    setEstado('activo');
    setFechaIngreso('');
    setIdDepartamento('');
    setIdRol('');
    setPassword('');
    setEmails([{ email: '', tipo: 'laboral', es_principal: true }]);
    setTelefonos([{ numero: '', tipo: 'móvil', es_principal: true }]);
    setSeleccionIdPersonal(null);
    setSeleccionIdPersona(null);
  };

  // -------- Cargar selección desde la tabla --------
  const seleccionarFila = async (row: RowListado) => {
    setSeleccionIdPersonal(row.id_personal);
    setNombre(row.nombre);
    setDocumentoId(row.documento_id);
    setEstado(row.estado as Estado);
    setFechaIngreso(row.fecha_ingreso ?? '');
    setIdDepartamento(String(row.id_departamento));
    setIdRol(String(row.id_rol));
    setPassword(''); // vacío para no forzar cambio

    const idP = await obtenerIdPersonaPorDocumento(row.documento_id);
    setSeleccionIdPersona(idP);

    if (idP) {
      const { data: ems } = await supabase.from('emails').select('email,tipo,es_principal').eq('id_persona', idP).order('es_principal', { ascending: false });
      const { data: tels } = await supabase.from('telefonos').select('numero,tipo,es_principal').eq('id_persona', idP).order('es_principal', { ascending: false });
      setEmails((ems as any[])?.length ? (ems as any[]).map(x => ({ email: x.email, tipo: x.tipo || 'laboral', es_principal: !!x.es_principal })) : [{ email: '', tipo: 'laboral', es_principal: true }]);
      setTelefonos((tels as any[])?.length ? (tels as any[]).map(x => ({ numero: x.numero, tipo: x.tipo || 'móvil', es_principal: !!x.es_principal })) : [{ numero: '', tipo: 'móvil', es_principal: true }]);
    } else {
      setEmails([{ email: '', tipo: 'laboral', es_principal: true }]);
      setTelefonos([{ numero: '', tipo: 'móvil', es_principal: true }]);
    }

    setMensaje('ℹ️ Modo edición: puedes modificar y guardar cambios.');
  };

  // -------- Modificar --------
  const modificar = async () => {
    setMensaje('');
    if (seleccionIdPersonal === null) {
      setMensaje('❌ No hay registro seleccionado para modificar.');
      return;
    }
    const err = validar();
    if (err) { setMensaje('❌ ' + err); return; }

    const { data: regActual } = await supabase
      .from('personal_operativo')
      .select('id_personal, documento_id')
      .eq('id_personal', seleccionIdPersonal)
      .maybeSingle();
    if (!regActual) {
      setMensaje('❌ El registro seleccionado ya no existe.');
      return;
    }

    if (regActual.documento_id !== documentoId) {
      const { data: duplicado } = await supabase
        .from('personal_operativo')
        .select('id_personal')
        .eq('documento_id', documentoId)
        .maybeSingle();
      if (duplicado) {
        setMensaje('❌ Ya existe otro personal con ese Documento ID.');
        return;
      }
    }

    let idP = seleccionIdPersona;
    if (!idP) {
      idP = await obtenerIdPersonaPorDocumento(regActual.documento_id);
      setSeleccionIdPersona(idP);
    }

    const partes = nombre.trim().split(/\s+/);
    const nombrePersona = partes[0] || '';
    const apellidoPersona = partes.slice(1).join(' ');

    try {
      if (idP) {
        const { error: upPer } = await supabase
          .from('persona')
          .update({
            nombre: nombrePersona,
            apellido: apellidoPersona,
            numero_documento: documentoId
          })
          .eq('id_persona', idP);
        if (upPer) throw new Error('Persona: ' + upPer.message);
      }

      const { error: upPO } = await supabase
        .from('personal_operativo')
        .update({
          nombre,
          documento_id: documentoId,
          estado,
          fecha_ingreso: fechaIngreso || null,
          id_departamento: parseInt(idDepartamento),
          id_rol: parseInt(idRol)
        })
        .eq('id_personal', seleccionIdPersonal);
      if (upPO) throw new Error('Personal: ' + upPO.message);

      if (idP) {
        await supabase.from('emails').delete().eq('id_persona', idP);
        await supabase.from('telefonos').delete().eq('id_persona', idP);

        if (emails.length) {
          const payloadEmails = emails.map(e => ({ id_persona: idP!, email: e.email, tipo: e.tipo || null, es_principal: !!e.es_principal }));
          const { error: eIns } = await supabase.from('emails').insert(payloadEmails);
          if (eIns) throw new Error('Emails: ' + eIns.message);
        }
        if (telefonos.length) {
          const payloadTels = telefonos.map(t => ({ id_persona: idP!, numero: t.numero, tipo: t.tipo || null, es_principal: !!t.es_principal }));
          const { error: tIns } = await supabase.from('telefonos').insert(payloadTels);
          if (tIns) throw new Error('Teléfonos: ' + tIns.message);
        }
      }

      const emailPrincipal = (emails.find(e => e.es_principal) || emails[0]).email;
      const { error: upUserEmail } = await supabase
        .from('usuarios_login')
        .update({ email: emailPrincipal, id_rol: parseInt(idRol) })
        .eq('id_personal', seleccionIdPersonal);
      if (upUserEmail) throw new Error('Usuario login: ' + upUserEmail.message);

      if (password.trim()) {
        const password_hash = await bcryptHash(password, 10);
        const { error: upPass } = await supabase
          .from('usuarios_login')
          .update({ password_hash })
          .eq('id_personal', seleccionIdPersonal);
        if (upPass) throw new Error('Password: ' + upPass.message);
      }

      setMensaje('✅ Cambios guardados correctamente.');
      await cargarListado();

    } catch (err: any) {
      setMensaje('❌ Error al modificar: ' + (err?.message || 'Desconocido'));
    }
  };

  // -------- Eliminar --------
  const eliminar = async () => {
    setMensaje('');
    if (seleccionIdPersonal === null) {
      setMensaje('❌ No hay registro seleccionado para eliminar.');
      return;
    }
    if (!window.confirm('¿Seguro que deseas eliminar este personal y sus datos asociados?')) return;

    try {
      // 1) Asegurar obtener documento y id_persona
      const { data: reg } = await supabase
        .from('personal_operativo')
        .select('documento_id')
        .eq('id_personal', seleccionIdPersonal)
        .maybeSingle();
      if (!reg) { setMensaje('❌ El registro ya no existe.'); await cargarListado(); limpiarFormulario(); return; }

      let idP = seleccionIdPersona;
      if (!idP) {
        idP = await obtenerIdPersonaPorDocumento(reg.documento_id);
      }

      // 2) Borrar usuario_login
      await supabase.from('usuarios_login').delete().eq('id_personal', seleccionIdPersonal);

      // 3) Borrar personal_operativo
      await supabase.from('personal_operativo').delete().eq('id_personal', seleccionIdPersonal);

      // 4) Borrar normalizados (emails/telefonos) y persona
      if (idP) {
        await supabase.from('emails').delete().eq('id_persona', idP);
        await supabase.from('telefonos').delete().eq('id_persona', idP);
        await supabase.from('persona').delete().eq('id_persona', idP);
      }

      setMensaje('🗑️ Registro eliminado correctamente.');
      await cargarListado();
      limpiarFormulario();
    } catch (err: any) {
      setMensaje('❌ Error al eliminar: ' + (err?.message || 'Desconocido'));
    }
  };

  // -------- Filtros en memoria --------
  const listadoFiltrado = listado.filter(r =>
    (!filtro.nombre || r.nombre.toLowerCase().includes(filtro.nombre.toLowerCase())) &&
    (!filtro.documento || r.documento_id.toLowerCase().includes(filtro.documento.toLowerCase())) &&
    (!filtro.departamento || String(r.id_departamento) === filtro.departamento) &&
    (!filtro.rol || String(r.id_rol) === filtro.rol) &&
    (!filtro.estado || r.estado === filtro.estado)
  );

  return (
    <>
      <div className="titulo-personal"><h1>Registrar / Modificar Personal</h1></div>

      <div className="contenedor-perso">
        <form className="contenedor-personal registrar-personal" onSubmit={(e) => { e.preventDefault(); registrar(); }}>
          <h2 className="subtitulo">Datos del Personal</h2>

          <label>
            <span className="etiqueta">Nombre completo</span>
            <input className="input-personal" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Ana Pérez" />
          </label>

          <label>
            <span className="etiqueta">Documento ID</span>
            <input className="input-personal" value={documentoId} onChange={e=>setDocumentoId(e.target.value)} placeholder="Ej: 001-1234567-8" />
          </label>

          <label>
            <span className="etiqueta">Departamento</span>
            <select className="input-personal" value={idDepartamento} onChange={e=>setIdDepartamento(e.target.value)}>
              <option value="">Seleccione</option>
              {departamentos.map(d => <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Rol</span>
            <select className="input-personal" value={idRol} onChange={e=>setIdRol(e.target.value)}>
              <option value="">Seleccione</option>
              {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
            </select>
          </label>

          <label>
            <span className="etiqueta">Estado</span>
            <select className="input-personal" value={estado} onChange={e=>setEstado(e.target.value as Estado)}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </label>

          <label>
            <span className="etiqueta">Fecha de Ingreso</span>
            <input className="input-personal" type="date" value={fechaIngreso} onChange={e=>setFechaIngreso(e.target.value)} />
          </label>

          <label>
            <span className="etiqueta">Contraseña (para el usuario)</span>
            <input
              className="input-personal"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder={seleccionIdPersonal ? 'Deja vacío para no cambiar' : 'Mínimo 6 caracteres'}
            />
            <label className="mostrar-pass">
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
              <span className="mostrar-pass__texto">Mostrar contraseña</span>
            </label>
          </label>

          {/* Emails */}
          <div className="panel panel-contacto">
            <h3>Emails</h3>
            {emails.map((e, i) => (
              <div className="fila-contacto" key={`email-${i}`}>
                <input
                  className="input-personal"
                  type="email"
                  placeholder="email@empresa.com"
                  value={e.email}
                  onChange={ev=>updateEmailValue(i,'email',ev.target.value)}
                />
                <select
                  className="input-personal"
                  value={e.tipo}
                  onChange={ev=>updateEmailValue(i,'tipo',ev.target.value)}
                >
                  <option value="laboral">laboral</option>
                  <option value="personal">personal</option>
                  <option value="otro">otro</option>
                </select>

                <label className="chk">
                  <input type="radio" name="email-principal" checked={e.es_principal} onChange={() => setPrincipalEmail(i)} />
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
                  className="input-personal"
                  placeholder="+1 809 555 0000"
                  value={t.numero}
                  onChange={ev=>updateTelefonoValue(i,'numero',ev.target.value)}
                />
                <select
                  className="input-personal"
                  value={t.tipo}
                  onChange={ev=>updateTelefonoValue(i,'tipo',ev.target.value)}
                >
                  <option value="móvil">móvil</option>
                  <option value="casa">casa</option>
                  <option value="oficina">oficina</option>
                  <option value="otro">otro</option>
                </select>

                <label className="chk">
                  <input type="radio" name="telefono-principal" checked={t.es_principal} onChange={() => setPrincipalTelefono(i)} />
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

          {/* Botones acción */}
          <div className="acciones-form">
            <button type="button" className="boton-verificar ancho-total" onClick={registrar}>Registrar</button>
            <button type="button" className="boton-secundario ancho-total" onClick={modificar}>Modificar</button>
            <button type="button" className="boton-peligro ancho-total" onClick={eliminar}>Eliminar</button>
            <button type="button" className="boton-terciario ancho-total" onClick={limpiarFormulario}>Limpiar</button>
          </div>

          {mensaje && <div className="resultado-ok">{mensaje}</div>}
        </form>

        {/* Consulta con filtros */}
        <div className="panel panel-consulta">
          <h2 className="subtitulo">Consulta / Selección</h2>

          <div className="filter-row">
            <input className="input-personal" placeholder="Nombre" value={filtro.nombre} onChange={e=>setFiltro(prev=>({...prev, nombre: e.target.value}))} />
            <input className="input-personal" placeholder="Documento" value={filtro.documento} onChange={e=>setFiltro(prev=>({...prev, documento: e.target.value}))} />
            <select className="input-personal" value={filtro.departamento} onChange={e=>setFiltro(prev=>({...prev, departamento: e.target.value}))}>
              <option value="">Departamento</option>
              {departamentos.map(d => <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>)}
            </select>
            <select className="input-personal" value={filtro.rol} onChange={e=>setFiltro(prev=>({...prev, rol: e.target.value}))}>
              <option value="">Rol</option>
              {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
            </select>
            <select className="input-personal" value={filtro.estado} onChange={e=>setFiltro(prev=>({...prev, estado: e.target.value}))}>
              <option value="">Estado</option>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>

          <table className="result-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Departamento</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {listadoFiltrado.map(row => (
                <tr
                  key={row.id_personal}
                  className={row.id_personal === seleccionIdPersonal ? 'fila-seleccionada' : ''}
                  onClick={() => seleccionarFila(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{row.id_personal}</td>
                  <td>{row.nombre}</td>
                  <td>{row.documento_id}</td>
                  <td>{row.dep_nombre}</td>
                  <td>{row.rol_nombre}</td>
                  <td>{row.estado}</td>
                </tr>
              ))}
              {listadoFiltrado.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 12 }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
