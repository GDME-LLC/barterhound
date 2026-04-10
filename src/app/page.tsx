import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-500 to-amber-400 px-5 py-12 text-white shadow-lg sm:px-8 sm:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-50/90">
          Local-first barter marketplace
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Trade what you have for what you actually want.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-white/85">
          BarterHound helps neighbors discover nearby listings, bundle offers,
          and complete trustworthy item-for-item trades.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-white px-5 py-3 font-medium text-brand-700 transition hover:bg-brand-50"
          >
            Create account
          </Link>
          <Link
            href="/listings"
            className="rounded-full border border-white/40 px-5 py-3 font-medium text-white transition hover:bg-white/10"
          >
            Browse listings
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Local discovery',
            copy: 'Browse listings by feed or map using approximate city-level locations.',
          },
          {
            title: 'Bundle offers',
            copy: 'Combine one or more listings plus optional credits to make a fair trade.',
          },
          {
            title: 'Auditable trust',
            copy: 'Trades, reviews, credits, and equity stay visible through explicit app flows.',
          },
        ].map((item) => (
          <article key={item.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">{item.title}</h2>
            <p className="mt-3 text-stone-500">{item.copy}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
