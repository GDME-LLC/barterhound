import Link from 'next/link'
import { getViewerContext } from '@/lib/auth'

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/listings', label: 'Browse' },
  { href: '/map', label: 'Map' },
]

const privateLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/listings/new', label: 'New listing' },
  { href: '/offers', label: 'Offers' },
]

export async function SiteShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getViewerContext()

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold text-brand-600">
              BarterHound
            </Link>
            <p className="text-sm text-stone-500">
              Local-first barter marketplace MVP
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                {privateLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-3 py-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                  >
                    {link.label}
                  </Link>
                ))}
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-full bg-stone-900 px-4 py-2 font-medium text-white transition hover:bg-stone-700"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-full border border-stone-300 px-4 py-2 font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600"
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
    </div>
  )
}
