import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureProfileRecord } from '@/lib/profile'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const formData = await request.formData()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '').trim()
  const next = String(formData.get('next') ?? '/dashboard')
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.redirect(
      new URL('/login?message=Supabase%20is%20not%20configured', origin),
    )
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?message=${encodeURIComponent(error.message)}`, origin),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await ensureProfileRecord({ supabase, user })
  }

  return NextResponse.redirect(new URL(next, origin))
}
