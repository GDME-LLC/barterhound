import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppBaseUrl } from '@/lib/app-url'

export async function POST(request: Request) {
  const appUrl = getAppBaseUrl(new URL(request.url))
  const supabase = await createClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/', appUrl))
}
