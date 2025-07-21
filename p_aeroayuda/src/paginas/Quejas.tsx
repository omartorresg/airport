import React, { useState } from 'react';
import '../styles/VerificacionPase.css';
import '../styles/FormQueja.css'; 

export default function FormQueja() {
  const [nombre, setNombre] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [numeroVuelo, setNumeroVuelo] = useState('');
  const [fechaIncidente, setFechaIncidente] = useState('');
  const [tipoQueja, setTipoQueja] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contacto, setContacto] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes enviar los datos al backend o supabase
    console.log({
      nombre,
      tipoDocumento,
      numeroDocumento,
      numeroVuelo,
      fechaIncidente,
      tipoQueja,
      descripcion,
      contacto,
      archivo
    });
  };

  return (
    <form className="contenedor-verificacion" onSubmit={manejarEnvio}>
      <h3 className="titulo-verificacion"> Formulario de Quejas</h3>

      <label>
        <span className='etiqueta'>Nombre Completo</span>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="input-verificacion" required />
      </label>

      <label>
        <span className='etiqueta'>Tipo de Documento</span>
        <input type="text" value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)} className="input-verificacion" required />
      </label>

      <label>
        <span className='etiqueta'>Número de Documento</span>
        <input type="text" value={numeroDocumento} onChange={e => setNumeroDocumento(e.target.value)} className="input-verificacion" required />
      </label>

      <label>
        <span className='etiqueta'>Número de Vuelo</span>
        <input type="text" value={numeroVuelo} onChange={e => setNumeroVuelo(e.target.value)} className="input-verificacion" />
      </label>

      <label>
        <span className='etiqueta'>Fecha del Incidente</span>
        <input type="date" value={fechaIncidente} onChange={e => setFechaIncidente(e.target.value)} className="input-verificacion" required />
      </label>

      <label>
        <span className='etiqueta'>Tipo de Queja</span>
        <select value={tipoQueja} onChange={e => setTipoQueja(e.target.value)} className="input-verificacion" required>
          <option value="">-- Selecciona --</option>
          <option value="equipaje">Problema con el equipaje</option>
          <option value="retraso">Retraso o cancelación</option>
          <option value="personal">Atención del personal</option>
          <option value="otro">Otro</option>
        </select>
      </label>

      <label>
        <span className='etiqueta'>Descripción de la Queja</span>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="input-verificacion" rows={4} required />
      </label>

      <label>
        <span className='etiqueta'>Teléfono o Correo de Contacto</span>
        <input type="text" value={contacto} onChange={e => setContacto(e.target.value)} className="input-verificacion" required />
      </label>

      <label>
        <span className='etiqueta'>Adjuntar Evidencia (opcional)</span>
        <input type="file" accept="image/*,.pdf" onChange={e => setArchivo(e.target.files?.[0] || null)} className="input-verificacion" />
      </label>

      <button type="submit" className="boton-verificar">Enviar Queja</button>
    </form>
  );
}
