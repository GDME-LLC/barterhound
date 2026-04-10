import { ListingFiltersForm } from '@/components/listing-filters'
import { ListingMap } from '@/components/listing-map'
import { getBrowseListings, type ListingFilters } from '@/lib/listings-query'
import { supabaseConfig } from '@/lib/supabase/config'

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<ListingFilters>
}) {
  const filters = await searchParams
  const listings = await getBrowseListings(filters)

  if (!supabaseConfig.mapboxToken) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:p-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Mapbox token required</h1>
          <p className="mt-3 max-w-2xl text-amber-900">
            Add `NEXT_PUBLIC_MAPBOX_TOKEN` to your environment before using the
            map browse experience.
          </p>
        </section>
        <ListingFiltersForm filters={filters} />
      </main>
    )
  }

  const mappableListings = listings
    .filter((listing) => typeof listing.lat === 'number' && typeof listing.lng === 'number')
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      location_label: listing.location_label,
      estimated_value: listing.estimated_value,
      lat: listing.lat,
      lng: listing.lng,
    }))

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-600">
          Map browse
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">
          See listings near you
        </h1>
        <p className="mt-3 max-w-2xl text-stone-500">
          Markers use approximate coordinates so the MVP stays local-first
          without storing exact meetup addresses.
        </p>
      </section>

      <ListingFiltersForm filters={filters} />

      <ListingMap listings={mappableListings} token={supabaseConfig.mapboxToken} />

      {mappableListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-6 text-sm text-stone-500 sm:p-8">
          No mappable listings yet. Add a city when creating a listing so it can
          appear on the map.
        </div>
      ) : null}
    </main>
  )
}
