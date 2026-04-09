const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseConfig = {
  publicUrl,
  publicAnonKey,
  serviceRoleKey,
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
}

export function hasSupabaseBrowserEnv() {
  return Boolean(publicUrl && publicAnonKey)
}

export function hasSupabaseAdminEnv() {
  return Boolean(publicUrl && serviceRoleKey)
}
