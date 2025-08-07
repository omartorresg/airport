import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import '../styles/asignacion.css';

interface Personal {
  id_personal: number;
  nombre: string;
  departamento: string;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface Equipo {
  id_equipo: number;
  nombre: string;
}

const AsignacionRolesEquipos = () => {
  const [personalDB, setPersonalDB] = useState<Personal[]>([]);
  const [rolesDB, setRolesDB] = useState<Rol[]>([]);
  const [equiposDB, setEquiposDB] = useState<Equipo[]>([]);

  const [idPersonal, setIdPersonal] = useState('');
  const [idRol, setIdRol] = useState('');
  const [idEquipo, setIdEquipo] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      // Personal operativo + nombre de departamento
      const { data: personal, error: errorPersonal } = await supabase
        .from('personal_operativo')
        .select('id_personal, nombre, departamentos(nombre)');

      // Roles
      const { data: roles, error: errorRoles } = await supabase
        .from('roles')
        .select();

      // Equipos
      const { data: equipos, error: errorEquipos } = await supabase
        .from('equipos')
        .select();

      if (errorPersonal || errorRoles || errorEquipos) {
        console.error('Error al cargar datos:', errorPersonal || errorRoles || errorEquipos);
        setMensaje('❌ Error al cargar los datos desde la base de datos.');
        return;
      }

      // Formateo del personal para incluir departamento
      const personalFormateado = (personal || []).map((p: any) => ({
        id_personal: p.id_personal,
        nombre: p.nombre,
        departamento: p.departamentos?.nombre || ''
      }));

      setPersonalDB(personalFormateado);
      setRolesDB(roles || []);
      setEquiposDB(equipos || []);
    };

    cargarDatos();
  }, []);

  const asignar = async () => {
    if (!idPersonal || !idRol || !idEquipo) {
      setMensaje('❌ Todos los campos son obligatorios.');
      return;
    }

    const { error } = await supabase.from('asignacion_roles_equipos').insert([
      {
        id_personal: parseInt(idPersonal),
        id_rol: parseInt(idRol),
        id_equipo: parseInt(idEquipo)
      }
    ]);

    if (error) {
      setMensaje('❌ Error al asignar: ' + error.message);
    } else {
      setMensaje('✅ Asignación realizada exitosamente.');
      setIdPersonal('');
      setIdRol('');
      setIdEquipo('');
    }
  };

  return (
    <>
      <div className="titulo-asignacion">
        <h1>Asignación de Roles y Equipos</h1>
      </div>

      <div className="contenedor-asig">
        <div className="contenedor-asignacion">
          <h2 className="subtitulo">Formulario de Asignación</h2>

          <label className="etiqueta">Personal Operativo:</label>
          <select className="input-asignacion" value={idPersonal} onChange={(e) => setIdPersonal(e.target.value)}>
            <option value="">Seleccione</option>
            {personalDB.map((p) => (
              <option key={p.id_personal} value={p.id_personal}>
                {`${p.nombre} - ${p.departamento}`}
              </option>
            ))}
          </select>

          <label className="etiqueta">Rol:</label>
          <select className="input-asignacion" value={idRol} onChange={(e) => setIdRol(e.target.value)}>
            <option value="">Seleccione</option>
            {rolesDB.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre_rol}
              </option>
            ))}
          </select>

          <label className="etiqueta">Equipo:</label>
          <select className="input-asignacion" value={idEquipo} onChange={(e) => setIdEquipo(e.target.value)}>
            <option value="">Seleccione</option>
            {equiposDB.map((eq) => (
              <option key={eq.id_equipo} value={eq.id_equipo}>
                {eq.nombre}
              </option>
            ))}
          </select>

          <button className="boton-verificar" onClick={asignar}>Asignar</button>

          {mensaje && <div className="resultado-ok">{mensaje}</div>}
        </div>
      </div>
    </>
  );
};

export default AsignacionRolesEquipos;
