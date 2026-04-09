import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureProfileRecord } from '@/lib/profile'
import { getAppBaseUrl } from '@/lib/app-url'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = getAppBaseUrl(requestUrl)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  if (!supabase || !code) {
    return NextResponse.redirect(new URL('/login?message=Unable%20to%20complete%20sign-in', appUrl))
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?message=${encodeURIComponent(error.message)}`, appUrl),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    try {
      await ensureProfileRecord({ supabase, user })
    } catch (profileError) {
      console.error('ensureProfileRecord failed after OAuth callback', profileError)
      return NextResponse.redirect(
        new URL('/dashboard?message=Signed%20in%2C%20but%20profile%20setup%20failed', appUrl),
        303,
      )
    }
  }

  return NextResponse.redirect(new URL(next, appUrl))
}
