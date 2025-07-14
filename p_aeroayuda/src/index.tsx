import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from '../src/SupabaseClient'

function App() {
  const [mensaje, setMensaje] = useState<string>('Cargando...')

  useEffect(() => {
    const obtenerPersonas = async () => {
      const { data, error } = await supabase.from('persona').select('*')

      if (error) {
        console.error('❌ Error:', error.message)
        setMensaje('Error al conectar con Supabase')
      } else if (data) {
        const nombres = data.map((p: any) => `${p.nombre} ${p.apellido}`).join(', ')
        setMensaje(`Personas: ${nombres}`)
      }
    }

    obtenerPersonas()
  }, [])

  return <h2>{mensaje}</h2>
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
