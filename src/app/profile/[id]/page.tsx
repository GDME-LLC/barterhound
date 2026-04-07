import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatPercent } from '@/lib/format'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-2xl font-semibold">Profile unavailable</h1>
        <p className="mt-2 text-sm text-amber-900">
          Configure Supabase to view public profiles.
        </p>
      </main>
    )
  }

  const [{ data: profile }, { data: listings }, { data: reviews }, { data: trades }, { data: equityRows }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('listings')
        .select('id, title, category, estimated_value, status')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('rating, reliability_score, comment, created_at')
        .eq('reviewee_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('trades')
        .select('status')
        .or(`initiator_id.eq.${id},receiver_id.eq.${id}`),
      supabase.from('equity_ledger').select('amount').eq('user_id', id),
    ])

  if (!profile) {
    return (
      <main className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <p className="mt-2 text-stone-500">
          This user has not completed a public profile yet.
        </p>
      </main>
    )
  }

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0
  const averageReliability =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.reliability_score, 0) / reviews.length
      : 0
  const resolvedTrades = (trades ?? []).filter((trade) =>
    ['completed', 'cancelled', 'disputed'].includes(trade.status),
  ).length
  const lifetimeEquity = (equityRows ?? []).reduce((sum, row) => sum + row.amount, 0)
  const cancelledTrades = (trades ?? []).filter((trade) => trade.status === 'cancelled').length
  const disputedTrades = (trades ?? []).filter((trade) => trade.status === 'disputed').length
  const completionRate =
    resolvedTrades > 0
      ? ((trades ?? []).filter((trade) => trade.status === 'completed').length / resolvedTrades) * 100
      : 0

  return (
    <main className="space-y-6">
      <section className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm md:grid-cols-[auto,1fr]">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.5rem] bg-brand-100 text-3xl font-semibold text-brand-700">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            profile.username.slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-brand-600">Public profile</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">
            {profile.display_name || profile.username}
          </h1>
          <p className="mt-2 text-stone-500">
            {profile.bio || 'This user has not added a bio yet.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-2">
              {profile.location_label || 'Location pending'}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-2">
              Radius {profile.trade_radius_km} km
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Average rating</p>
          <p className="mt-2 text-3xl font-semibold">{averageRating.toFixed(1)}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Reliability</p>
          <p className="mt-2 text-3xl font-semibold">{averageReliability.toFixed(1)}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Completion rate</p>
          <p className="mt-2 text-3xl font-semibold">{formatPercent(completionRate)}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Listings</p>
          <p className="mt-2 text-3xl font-semibold">{listings?.length ?? 0}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Cancelled trades</p>
          <p className="mt-2 text-3xl font-semibold">{cancelledTrades}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Disputes</p>
          <p className="mt-2 text-3xl font-semibold">{disputedTrades}</p>
        </article>
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Lifetime equity</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(lifetimeEquity)}</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Active listings</h2>
            <Link href="/listings" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Browse all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(listings ?? []).length > 0 ? (
              listings?.map((listing) => (
                <div key={listing.id} className="rounded-2xl border border-stone-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-900">{listing.title}</p>
                      <p className="text-sm text-stone-500">{listing.category}</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-wide text-stone-600">
                      {listing.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
                No listings yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Recent reviews</h2>
          <div className="mt-4 space-y-3">
            {(reviews ?? []).length > 0 ? (
              reviews?.slice(0, 5).map((review, index) => (
                <div key={`${review.created_at}-${index}`} className="rounded-2xl border border-stone-200 px-4 py-3">
                  <p className="text-sm font-medium text-stone-900">
                    {review.rating}/5 rating · {review.reliability_score}/5 reliability
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    {review.comment || 'No written comment.'}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
                No reviews yet.
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
