import { listingCategories, listingConditions } from '@/lib/listing-options'
import type { ListingFilters } from '@/lib/listings-query'

export function ListingFiltersForm({
  filters,
}: {
  filters: ListingFilters
}) {
  return (
    <form className="grid gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-6">
      <input
        name="query"
        placeholder="Search listings"
        defaultValue={filters.query ?? ''}
        className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500 md:col-span-2"
      />
      <select
        name="category"
        defaultValue={filters.category ?? ''}
        className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
      >
        <option value="">All categories</option>
        {listingCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select
        name="condition"
        defaultValue={filters.condition ?? ''}
        className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
      >
        <option value="">Any condition</option>
        {listingConditions.map((condition) => (
          <option key={condition.value} value={condition.value}>
            {condition.label}
          </option>
        ))}
      </select>
      <select
        name="trade"
        defaultValue={filters.trade ?? ''}
        className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
      >
        <option value="">Any trade method</option>
        <option value="local">Local meetup</option>
        <option value="shipping">Shipping</option>
      </select>
      <div className="grid grid-cols-[1fr,1fr,auto] gap-2 md:col-span-6">
        <input
          name="min"
          type="number"
          min={0}
          placeholder="Min USD"
          defaultValue={filters.min ?? ''}
          className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
        />
        <input
          name="max"
          type="number"
          min={0}
          placeholder="Max USD"
          defaultValue={filters.max ?? ''}
          className="rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600"
        >
          Apply
        </button>
      </div>
    </form>
  )
}
