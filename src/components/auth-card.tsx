import Link from 'next/link'
import { SupabaseWarning } from '@/components/supabase-warning'
import { hasSupabaseBrowserEnv } from '@/lib/supabase/config'

export function AuthCard({
  title,
  description,
  action,
  submitLabel,
  alternateHref,
  alternateLabel,
  message,
}: {
  title: string
  description: string
  action: '/auth/login' | '/auth/signup'
  submitLabel: string
  alternateHref: string
  alternateLabel: string
  message?: string
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-6">
      {!hasSupabaseBrowserEnv() && <SupabaseWarning />}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 text-stone-500">{description}</p>

        {message ? (
          <p className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
            {message}
          </p>
        ) : null}

        <form action={action} method="post" className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            Email
            <input type="email" name="email" required className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
          </label>

          <label className="block space-y-2 text-sm font-medium text-stone-700">
            Password
            <input type="password" name="password" required minLength={8} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
          </label>

          <button type="submit" className="w-full rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600">
            {submitLabel}
          </button>
        </form>

        <div className="mt-4 space-y-3">
          <form action="/auth/google" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3 font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <form action="/auth/facebook" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] px-5 py-3 font-medium text-white shadow-sm transition hover:bg-[#1464D2] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="white">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
              </svg>
              Continue with Facebook
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-stone-500">
          <Link href={alternateHref} className="font-medium text-brand-600 hover:text-brand-700">
            {alternateLabel}
          </Link>
        </p>
      </section>
    </main>
  )
}
