import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfig } from '@/lib/supabase/config'

export async function POST(request: Request) {
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.redirect(
      new URL('/signup?message=Supabase%20is%20not%20configured', supabaseConfig.appUrl),
    )
  }

  const formData = await request.formData()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '').trim()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${supabaseConfig.appUrl}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      new URL(`/signup?message=${encodeURIComponent(error.message)}`, supabaseConfig.appUrl),
    )
  }

  return NextResponse.redirect(
    new URL('/login?message=Check%20your%20email%20to%20confirm%20your%20account', supabaseConfig.appUrl),
  )
}
