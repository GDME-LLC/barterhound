import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { acceptOfferAction, updateOfferStatusAction } from '@/app/offers/actions'
import { formatCurrency } from '@/lib/format'

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>
}) {
  const { thread } = await searchParams
  const { supabase, user } = await requireProfile()

  await supabase
    .from('offers')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())

  const [{ data: offers }, { data: threads }] = await Promise.all([
    supabase
      .from('offers')
      .select('*, listing:listings(*), offer_items(*), trades(*)')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('offers')
      .select('id, root_offer_id, listing_id, from_user_id, to_user_id, status, created_at')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
  ])

  const grouped = new Map<string, any[]>()

  for (const offer of offers ?? []) {
    const key = offer.root_offer_id ?? offer.id
    grouped.set(key, [...(grouped.get(key) ?? []), offer])
  }

  const selectedKey = thread ?? (threads?.[0] ? threads[0].root_offer_id ?? threads[0].id : null)
  const selectedThread = selectedKey ? grouped.get(selectedKey) ?? [] : []

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-600">Offer inbox</p>
        <h1 className="mt-3 text-4xl font-semibold text-stone-900">
          Review inbound, outbound, and counter offers
        </h1>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
        <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Threads</h2>
          <div className="mt-4 space-y-3">
            {(threads ?? []).length > 0 ? (
              [...new Map((threads ?? []).map((item) => [item.root_offer_id ?? item.id, item])).values()].map((offer) => (
                <Link
                  key={offer.id}
                  href={`/offers?thread=${offer.root_offer_id ?? offer.id}`}
                  className={`block rounded-2xl border px-4 py-3 text-sm transition ${
                    selectedKey === (offer.root_offer_id ?? offer.id)
                      ? 'border-brand-300 bg-brand-50 text-brand-900'
                      : 'border-stone-200 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  <p className="font-medium">
                    {offer.from_user_id === user.id ? 'Outgoing thread' : 'Incoming thread'}
                  </p>
                  <p className="mt-1 text-stone-500">Status: {offer.status}</p>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
                No offer threads yet.
              </p>
            )}
          </div>
        </aside>

        <section className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Thread detail</h2>
            {selectedThread[0]?.listing_id ? (
              <Link href={`/offers/new?listing=${selectedThread[0].listing_id}&parent=${selectedThread[selectedThread.length - 1]?.id ?? ''}`} className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
                Counter offer
              </Link>
            ) : null}
          </div>

          {selectedThread.length > 0 ? (
            selectedThread.map((offer) => {
              const listing = Array.isArray(offer.listing) ? offer.listing[0] : offer.listing
              const isReceiver = offer.to_user_id === user.id
              return (
                <article key={offer.id} className="rounded-3xl border border-stone-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-brand-600">
                        {isReceiver ? 'Incoming' : 'Outgoing'} offer
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-stone-900">
                        {listing?.title ?? 'Listing'}
                      </h3>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-wide text-stone-600">
                      {offer.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-stone-100 px-4 py-3">
                      <p className="text-sm text-stone-500">Credits</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">
                        {formatCurrency(offer.credits_offered)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-100 px-4 py-3 md:col-span-2">
                      <p className="text-sm text-stone-500">Message</p>
                      <p className="mt-1 text-sm text-stone-700">
                        {offer.message || 'No message provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-stone-900">Included listings</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(offer.offer_items ?? []).length > 0 ? (
                        offer.offer_items.map((item: any) => (
                          <span key={item.id} className="rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-700">
                            {formatCurrency(item.estimated_value)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-700">
                          Credits-only offer
                        </span>
                      )}
                    </div>
                  </div>

                  {offer.status === 'pending' ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {isReceiver ? (
                        <>
                          {listing?.is_local ? (
                            <form action={acceptOfferAction}>
                              <input type="hidden" name="offer_id" value={offer.id} />
                              <input type="hidden" name="trade_type" value="local_meetup" />
                              <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700">
                                Accept as local trade
                              </button>
                            </form>
                          ) : null}
                          {listing?.is_shippable ? (
                            <form action={acceptOfferAction}>
                              <input type="hidden" name="offer_id" value={offer.id} />
                              <input type="hidden" name="trade_type" value="shipped" />
                              <button type="submit" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
                                Accept as shipped trade
                              </button>
                            </form>
                          ) : null}
                          <form action={updateOfferStatusAction}>
                            <input type="hidden" name="offer_id" value={offer.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900">
                              Reject
                            </button>
                          </form>
                        </>
                      ) : (
                        <form action={updateOfferStatusAction}>
                          <input type="hidden" name="offer_id" value={offer.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900">
                            Cancel offer
                          </button>
                        </form>
                      )}
                    </div>
                  ) : null}
                </article>
              )
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-200 px-4 py-8 text-sm text-stone-500">
              Select a thread to review its offer history.
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
