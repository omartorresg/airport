
import  supabase  from '../SupabaseClient';
import { Queja } from '../tipos/TiposQuejas';

export const registrarQueja = async (queja: Queja) => {
  const { data, error } = await supabase.from('quejas').insert([queja]);
  return { data, error };
};

export const obtenerQuejas = async () => {
  const { data, error } = await supabase.from('quejas').select('*');
  return { data, error };
};
