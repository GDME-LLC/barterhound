// Browser-side Supabase client
// Full implementation in Phase 3
import { createBrowserClient } from '@supabase/ssr'
import { hasSupabaseBrowserEnv, supabaseConfig } from '@/lib/supabase/config'

export function createClient() {
  if (!hasSupabaseBrowserEnv()) {
    return null
  }

  return createBrowserClient(
    supabaseConfig.publicUrl!,
    supabaseConfig.publicAnonKey!,
  )
}
