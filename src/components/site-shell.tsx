import Link from 'next/link'

const publicLinks = [
  { href: '/deals', label: 'Hardware Monitor' },
]
export async function SiteShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/deals" className="text-2xl font-bold text-orange-600">
              ServerScout
            </Link>
            <p className="text-sm text-stone-500">
              Home Server Hardware Finder
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 sm:py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
    </div>
  )
}
