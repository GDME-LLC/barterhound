import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import { removeListingAction } from '@/app/listings/actions'
import { getViewerContext } from '@/lib/auth'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { user } = await getViewerContext()

  if (!supabase) {
    return (
      <main className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-2xl font-semibold">Listing unavailable</h1>
        <p className="mt-2 text-sm text-amber-900">
          Configure Supabase to browse listing details.
        </p>
      </main>
    )
  }

  const [{ data: listing }, { data: images }] = await Promise.all([
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .in('status', ['active', 'pending', 'traded', 'removed'])
      .maybeSingle(),
    supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', id)
      .order('position', { ascending: true }),
  ])

  if (!listing) {
    notFound()
  }

  const { data: owner } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', listing.user_id)
    .maybeSingle()
  const isOwner = user?.id === listing.user_id

  return (
    <main className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            {(images ?? []).length > 0 ? (
              images?.map((image) => (
                <Image
                  key={image.id}
                  src={image.url}
                  alt={listing.title}
                  width={600}
                  height={600}
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              ))
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-stone-50 text-sm text-stone-500">
                No images yet
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-600">
            {listing.category}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-900">
            {listing.title}
          </h1>
          <p className="mt-4 text-stone-500">{listing.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Estimated value</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">
                {formatCurrency(listing.estimated_value)}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Condition</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">
                {listing.condition.replace('_', ' ')}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Trade methods</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">
                {[listing.is_local ? 'Local' : null, listing.is_shippable ? 'Shipping' : null]
                  .filter(Boolean)
                  .join(' + ')}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <p className="text-sm text-stone-500">Location</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">
                {listing.location_label || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 px-4 py-4">
            <p className="text-sm font-medium text-stone-900">Looking for</p>
            <p className="mt-2 text-sm text-stone-500">
              {listing.trade_for || 'Open to fair barter offers.'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Link href={`/listings/${listing.id}/edit`} className="rounded-full bg-stone-900 px-5 py-3 font-medium text-white transition hover:bg-stone-700">
                  Edit listing
                </Link>
                <form action={removeListingAction}>
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <button type="submit" className="rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900">
                    Mark removed
                  </button>
                </form>
              </>
            ) : (
              <Link href={`/offers/new?listing=${listing.id}`} className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600">
                Make an offer
              </Link>
            )}
          </div>

          <div className="mt-6 border-t border-stone-200 pt-6">
            <p className="text-sm text-stone-500">Listed by</p>
            <p className="mt-2 text-lg font-medium text-stone-900">
              {owner?.display_name || owner?.username || 'BarterHound member'}
            </p>
            {owner?.id ? (
              <Link href={`/profile/${owner.id}`} className="mt-2 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">
                View public profile
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  )
}
