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

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-stone-900">{title}</h1>
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

        <form action="/auth/google" method="post" className="mt-3">
          <button type="submit" className="w-full rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900">
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-sm text-stone-500">
          <Link href={alternateHref} className="font-medium text-brand-600 hover:text-brand-700">
            {alternateLabel}
          </Link>
        </p>
      </section>
    </main>
  )
}
