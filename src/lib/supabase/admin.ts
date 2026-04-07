import { createClient } from '@supabase/supabase-js'
import { hasSupabaseAdminEnv, supabaseConfig } from '@/lib/supabase/config'

export function createAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    return null
  }

  return createClient(
    supabaseConfig.publicUrl!,
    supabaseConfig.serviceRoleKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
