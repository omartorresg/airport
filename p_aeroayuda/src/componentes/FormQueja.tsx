
import { useState } from "react";
import  supabase  from "../SupabaseClient"
import { Queja } from "../tipos/TiposQuejas";

export default function FormQueja() {
  const [formData, setFormData] = useState<Queja>({
    id_pasajero: 1, // Simulado por ahora
    id_area: 1,
    tipo_queja: "",
    descripcion: "",
    fecha: new Date().toISOString(),
    estado: "pendiente",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from("quejas").insert([formData]);
    if (error) {
      alert("Error al registrar la queja");
      console.error(error);
    } else {
      alert("Queja registrada correctamente");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Tipo de queja</label>
      <input name="tipo_queja" onChange={handleChange} required />

      <label>Descripción</label>
      <textarea name="descripcion" onChange={handleChange} required />

      <button type="submit">Enviar Queja</button>
    </form>
  );
}
