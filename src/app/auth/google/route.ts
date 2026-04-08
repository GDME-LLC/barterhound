import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.redirect(
      new URL('/login?message=Supabase%20is%20not%20configured', origin),
    )
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(error?.message ?? 'Unable to start Google sign-in')}`,
        origin,
      ),
    )
  }

  return NextResponse.redirect(data.url)
}
