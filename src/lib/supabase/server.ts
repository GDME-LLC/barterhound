// Server-side Supabase client (Next.js App Router)
// Full implementation in Phase 3
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieMethods = Parameters<typeof createServerClient>[2]['cookies']
type CookiesToSet = Parameters<NonNullable<CookieMethods>['setAll']>[0]

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookiesToSet) {
          try {
            cookiesToSet.forEach((cookie: CookiesToSet[number]) =>
              cookieStore.set(cookie.name, cookie.value, cookie.options),
            )
          } catch {
            // setAll called from a Server Component - cookies are read-only
          }
        },
      },
    },
  )
}
