import { createClient } from '@supabase/supabase-js'
import { config } from './index'

if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration')
}

export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

export const supabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    }
  }
)

// Export both for backward compatibility
export const supabase = supabaseAdmin
