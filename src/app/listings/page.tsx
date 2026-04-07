import { ListingCard } from '@/components/listing-card'
import { ListingFiltersForm } from '@/components/listing-filters'
import { SupabaseWarning } from '@/components/supabase-warning'
import { getBrowseListings, type ListingFilters } from '@/lib/listings-query'
import { hasSupabaseBrowserEnv } from '@/lib/supabase/config'

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<ListingFilters>
}) {
  const filters = await searchParams
  const listings = await getBrowseListings(filters)

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-600">
          Browse listings
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-stone-900">
          Find local barter opportunities
        </h1>
        <p className="mt-3 max-w-2xl text-stone-500">
          Search by keyword, condition, value, or trade method. The map view uses
          the same filters and approximate city-level coordinates.
        </p>
      </section>

      {!hasSupabaseBrowserEnv() ? <SupabaseWarning /> : null}

      <ListingFiltersForm filters={filters} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listings.length > 0 ? (
          listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-8 text-sm text-stone-500 md:col-span-2 xl:col-span-3">
            No listings matched these filters yet.
          </div>
        )}
      </section>
    </main>
  )
}
