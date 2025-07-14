// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rosxxkedrmzatqomingk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvc3h4a2Vkcm16YXRxb21pbmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NDE1MDYsImV4cCI6MjA2ODAxNzUwNn0.6OFLaWOkFidfF-_7yl1ObLsrE3wzbqKiA1xqX_y-dRU'

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase