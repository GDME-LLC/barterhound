import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { formatCurrency } from '@/lib/format'
import { ReviewForm } from '@/components/review-form'
import { updateTradeStatusAction } from '@/app/trades/actions'
import { ShipmentForm } from '@/components/shipment-form'

export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, user } = await requireProfile()

  const [{ data: trade }, { data: shipments }, { data: offer }, { data: reviews }] =
    await Promise.all([
      supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .maybeSingle(),
      supabase
        .from('shipments')
        .select('*')
        .eq('trade_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('offers')
        .select('*, offer_items(*), listing:listings(*)')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('reviews').select('*').eq('trade_id', id),
    ])

  if (!trade) {
    notFound()
  }

  const { data: acceptedOffer } = await supabase
    .from('offers')
    .select('*, offer_items(*), listing:listings(*)')
    .eq('id', trade.offer_id)
    .maybeSingle()

  const currentOffer = acceptedOffer ?? offer
  const listing = Array.isArray(currentOffer?.listing) ? currentOffer.listing[0] : currentOffer?.listing
  const hasUserReview = (reviews ?? []).some((review) => review.reviewer_id === user.id)
  const otherUserId = trade.initiator_id === user.id ? trade.receiver_id : trade.initiator_id

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-600">Trade workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">
          {listing?.title ?? 'Trade detail'}
        </h1>
        <p className="mt-3 text-stone-500">
          Keep status changes explicit so the trade history stays easy to audit.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <article className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Trade summary</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">{trade.status}</p>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Trade type</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">{trade.type}</p>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Credits</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {formatCurrency(currentOffer?.credits_offered ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Offer items</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {currentOffer?.offer_items?.length ?? 0}
              </p>
            </div>
          </div>

          {trade.status !== 'completed' && trade.status !== 'cancelled' && trade.status !== 'disputed' ? (
            <div className="flex flex-wrap gap-3">
              {trade.status === 'agreed' ? (
                <form action={updateTradeStatusAction}>
                  <input type="hidden" name="trade_id" value={trade.id} />
                  <input type="hidden" name="status" value="in_progress" />
                  <button type="submit" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
                    Mark in progress
                  </button>
                </form>
              ) : null}
              {trade.status === 'in_progress' ? (
                <form action={updateTradeStatusAction}>
                  <input type="hidden" name="trade_id" value={trade.id} />
                  <input type="hidden" name="status" value="completed" />
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700">
                    Mark completed
                  </button>
                </form>
              ) : null}
              <form action={updateTradeStatusAction}>
                <input type="hidden" name="trade_id" value={trade.id} />
                <input type="hidden" name="status" value="cancelled" />
                <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900">
                  Cancel trade
                </button>
              </form>
              <form action={updateTradeStatusAction}>
                <input type="hidden" name="trade_id" value={trade.id} />
                <input type="hidden" name="status" value="disputed" />
                <button type="submit" className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:border-red-500 hover:text-red-800">
                  Mark disputed
                </button>
              </form>
            </div>
          ) : null}

          {trade.type === 'local_meetup' ? (
            <div className="rounded-2xl border border-stone-200 px-4 py-4">
              <p className="text-sm font-medium text-stone-900">Meetup notes</p>
              <p className="mt-2 text-sm text-stone-500">
                Coordinate the exact time and address outside the app, then use
                the status buttons here to keep the trade record accurate.
              </p>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-stone-200 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-stone-900">Shipment entries</p>
                <Link href={`/trades/${trade.id}/shipment`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Refresh shipments
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {(shipments ?? []).length > 0 ? (
                  shipments?.map((shipment) => (
                    <div key={shipment.id} className="rounded-2xl bg-stone-100 px-4 py-3">
                      <p className="font-medium text-stone-900">
                        {shipment.direction} · {shipment.status}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {shipment.carrier || 'Carrier pending'} · {shipment.tracking_number || 'Tracking pending'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">No shipment entries yet.</p>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ShipmentForm
                  tradeId={trade.id}
                  direction="outbound"
                  shipment={(shipments ?? []).find((shipment) => shipment.direction === 'outbound')}
                />
                <ShipmentForm
                  tradeId={trade.id}
                  direction="inbound"
                  shipment={(shipments ?? []).find((shipment) => shipment.direction === 'inbound')}
                />
              </div>
            </div>
          )}
        </article>

        <aside className="space-y-4">
          {trade.status === 'completed' && !hasUserReview ? (
            <ReviewForm tradeId={trade.id} revieweeId={otherUserId} />
          ) : null}

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Reviews on this trade</h2>
            <div className="mt-4 space-y-3">
              {(reviews ?? []).length > 0 ? (
                reviews?.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-stone-200 px-4 py-3">
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
                  Reviews will appear here after completion.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}
