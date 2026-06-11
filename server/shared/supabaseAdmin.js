import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseUrl && serviceRole
  ? createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null
