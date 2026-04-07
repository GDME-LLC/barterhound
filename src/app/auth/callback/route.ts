import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureProfileRecord } from '@/lib/profile'
import { supabaseConfig } from '@/lib/supabase/config'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  if (!supabase || !code) {
    return NextResponse.redirect(new URL('/login?message=Unable%20to%20complete%20sign-in', supabaseConfig.appUrl))
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?message=${encodeURIComponent(error.message)}`, supabaseConfig.appUrl),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await ensureProfileRecord({ supabase, user })
  }

  return NextResponse.redirect(new URL(next, supabaseConfig.appUrl))
}
