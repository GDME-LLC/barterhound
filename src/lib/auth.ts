import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const getViewerContext = cache(async () => {
  const supabase = await createClient()

  if (!supabase) {
    return {
      supabase: null,
      user: null,
      profile: null,
      isConfigured: false,
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      isConfigured: true,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return {
    supabase,
    user,
    profile,
    isConfigured: true,
  }
})

export async function requireUser() {
  const context = await getViewerContext()

  if (!context.isConfigured) {
    redirect('/login?message=Supabase%20is%20not%20configured')
  }

  if (!context.user) {
    redirect('/login')
  }

  return context
}

export async function requireProfile() {
  const context = await requireUser()

  if (!context.profile) {
    redirect('/dashboard?message=Complete%20your%20profile')
  }

  return context
}
