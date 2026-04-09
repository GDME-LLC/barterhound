import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppBaseUrl } from '@/lib/app-url'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = getAppBaseUrl(requestUrl)
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.redirect(
      new URL('/login?message=Supabase%20is%20not%20configured', appUrl),
    )
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(error?.message ?? 'Unable to start Facebook sign-in')}`,
        appUrl,
      ),
    )
  }

  return NextResponse.redirect(data.url)
}
