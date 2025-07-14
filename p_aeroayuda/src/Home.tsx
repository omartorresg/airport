import { FC } from 'react'
import supabase  from '../src/SupabaseClient'

const Home: FC = () => {
  console.log('Cliente Supabase:', supabase)

  return (
    <div className="page home">
      <h2>Home</h2>
    </div>
  )
}

export default Home
