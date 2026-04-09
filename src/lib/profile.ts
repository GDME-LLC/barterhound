import type { User } from '@supabase/supabase-js'

type ProfileRecord = {
  id: string
  username: string
  display_name: string | null
}

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
}

function ensureUsernameMeetsConstraints(base: string) {
  // DB constraint: char_length(username) between 3 and 24.
  const normalized = slugifyUsername(base) || 'barterhound-user'
  if (normalized.length >= 3) return normalized
  return `${normalized}-user`.slice(0, 24)
}

function deriveProfileDefaults(user: User) {
  const emailPrefix = user.email?.split('@')[0] ?? 'barterhound-user'
  const baseUsername = ensureUsernameMeetsConstraints(emailPrefix)
  const displayName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
    : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null

  return {
    username: baseUsername,
    display_name: displayName,
  }
}

export async function ensureProfileRecord({
  supabase,
  user,
}: {
  supabase: any
  user: User
}) {
  const existing = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existing.data) {
    return existing.data
  }

  const defaults = deriveProfileDefaults(user)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username =
      attempt === 0 ? defaults.username : `${defaults.username}${attempt + 1}`

    if (username.length < 3) {
      continue
    }

    const result = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        display_name: defaults.display_name,
      })
      .select('*')
      .single()

    if (!result.error) {
      return result.data
    }

    if (result.error.code !== '23505') {
      throw new Error(result.error.message)
    }
  }

  throw new Error('Unable to create a unique username for this profile.')
}
