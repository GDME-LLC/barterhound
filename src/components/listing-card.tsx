import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'

export function ListingCard({
  listing,
}: {
  listing: any
}) {
  const image = listing.listing_images?.[0]
  const owner = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-stone-100">
        {image ? (
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
            <p className="text-xs uppercase tracking-[0.2em] text-brand-600">
              {listing.category}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">
              {listing.title}
            </h2>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-wide text-stone-600">
            {listing.condition.replace('_', ' ')}
          </span>
        </div>
        <p className="line-clamp-3 text-sm text-stone-500">{listing.description ?? ''}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <span>{formatCurrency(listing.estimated_value)}</span>
          <span>-</span>
          <span>{listing.location_label || 'Location pending'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            {owner?.display_name || owner?.username || 'Community member'}
          </p>
          <Link href={`/listings/${listing.id}`} className="font-medium text-brand-600 hover:text-brand-700">
            View listing
          </Link>
        </div>
      </div>
    </article>
  )
}
