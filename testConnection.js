import 'dotenv/config' // This loads variables from .env

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  const { data, error } = await supabase.from('users').select('*')
  console.log('Data:', data)
  console.log('Error:', error)
}

testConnection()
