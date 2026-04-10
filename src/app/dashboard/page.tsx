import Link from 'next/link'
import Image from 'next/image'
import { ProfileForm } from '@/components/profile-form'
import { SupabaseWarning } from '@/components/supabase-warning'
import { requireUser } from '@/lib/auth'
import { formatCurrency, formatPercent } from '@/lib/format'
import { removeListingAction } from '@/app/listings/actions'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const { supabase, user, profile, isConfigured } = await requireUser()

  if (!isConfigured || !supabase) {
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <SupabaseWarning />
      </main>
    )
  }

  const [
    { data: listings },
    { data: incomingOffers },
    { data: creditRows },
    { data: trades },
    { data: equityRows },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, status, listing_images(url, position)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('offers').select('id').eq('to_user_id', user.id),
    supabase.from('credit_ledger').select('amount').eq('user_id', user.id),
    supabase.from('trades').select('status').or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase.from('equity_ledger').select('amount').eq('user_id', user.id),
  ])

  const creditBalance = (creditRows ?? []).reduce((sum, row) => sum + row.amount, 0)
  const lifetimeEquity = (equityRows ?? []).reduce((sum, row) => sum + row.amount, 0)
  const completedTrades = (trades ?? []).filter((trade) => trade.status === 'completed').length
  const cancelledTrades = (trades ?? []).filter((trade) => trade.status === 'cancelled').length
  const disputedTrades = (trades ?? []).filter((trade) => trade.status === 'disputed').length
  const resolvedTrades = (trades ?? []).filter((trade) =>
    ['completed', 'cancelled', 'disputed'].includes(trade.status),
  ).length
  const completionRate = resolvedTrades > 0 ? (completedTrades / resolvedTrades) * 100 : 0

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">
          Authenticated workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">
          {profile?.display_name || profile?.username || user.email}
        </h1>
        <p className="mt-3 max-w-2xl text-stone-500">
          Finish your public profile now, then move on to listings, offers, and
          trades as later phases come online.
        </p>
        {message ? (
          <p className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
            {message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Listings</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">{listings?.length ?? 0}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Incoming offers</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">{incomingOffers?.length ?? 0}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Credits</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">{formatCurrency(creditBalance)}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Completion rate</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">{formatPercent(completionRate)}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Lifetime equity</p>
          <p className="mt-2 text-2xl font-semibold sm:text-3xl">{formatCurrency(lifetimeEquity)}</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr,0.9fr]">
        <ProfileForm profile={profile} userId={user.id} />

        <aside className="space-y-4">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Quick links</h2>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link href="/listings/new" className="rounded-2xl border border-stone-200 px-4 py-3 transition hover:border-brand-300 hover:text-brand-700">
                Create a listing
              </Link>
              <Link href="/offers" className="rounded-2xl border border-stone-200 px-4 py-3 transition hover:border-brand-300 hover:text-brand-700">
                Review offers
              </Link>
              <Link href={`/profile/${user.id}`} className="rounded-2xl border border-stone-200 px-4 py-3 transition hover:border-brand-300 hover:text-brand-700">
                View public profile
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Current profile state</h2>
            <dl className="mt-4 space-y-3 text-sm text-stone-600">
              <div className="flex items-center justify-between gap-4">
                <dt>Email</dt>
                <dd className="font-medium text-stone-900">{user.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Location</dt>
                <dd className="font-medium text-stone-900">
                  {profile?.location_label ?? 'Not set yet'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Trade radius</dt>
                <dd className="font-medium text-stone-900">
                  {profile?.trade_radius_km ?? 50} km
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Cancelled trades</dt>
                <dd className="font-medium text-stone-900">{cancelledTrades}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Disputed trades</dt>
                <dd className="font-medium text-stone-900">{disputedTrades}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-stone-900">Your listings</h2>
          <Link
            href="/listings/new"
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            New listing
          </Link>
        </div>

        {listings && listings.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing: any) => {
              const image = listing.listing_images?.slice?.().sort?.((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))?.[0]
              return (
                <article key={listing.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-stone-100">
                    {image?.url ? (
                      <Image src={image.url} alt={listing.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-900">{listing.title}</h3>
                        <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">{listing.status}</p>
                      </div>
                      <Link href={`/listings/${listing.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                        View
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
                      >
                        Edit
                      </Link>
                      <form action={removeListingAction}>
                        <input type="hidden" name="listing_id" value={listing.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-rose-400 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-600">
            You have no listings yet.
          </p>
        )}
      </section>
    </main>
  )
}
