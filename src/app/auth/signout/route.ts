import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfig } from '@/lib/supabase/config'

export async function POST() {
  const supabase = await createClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/', supabaseConfig.appUrl))
}
