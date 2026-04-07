'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createListingAction, updateListingAction } from '@/app/listings/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'
import { listingCategories, listingConditions } from '@/lib/listing-options'
import type { Listing, ListingImage } from '@/types'

type ListingFormProps = {
  mode: 'create' | 'edit'
  listing?: Listing | null
  images?: ListingImage[]
}

export function ListingForm({ mode, listing, images = [] }: ListingFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    mode === 'create' ? createListingAction : updateListingAction,
    undefined,
  )

  useEffect(() => {
    if (state?.success?.startsWith('Listing created:')) {
      const listingId = state.success.split(':')[1]
      router.push(`/listings/${listingId}`)
    }
  }, [router, state])

  return (
    <form action={formAction} className="space-y-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">
          {mode === 'create' ? 'Create listing' : 'Edit listing'}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Keep listings practical: honest condition, city-level location, and the
          trade methods you can actually support.
        </p>
      </div>

      <FormMessage state={state} />

      {mode === 'edit' ? (
        <input type="hidden" name="listing_id" value={listing?.id ?? ''} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Title
          <input name="title" defaultValue={listing?.title ?? ''} required minLength={3} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Description
          <textarea name="description" defaultValue={listing?.description ?? ''} required minLength={10} className="min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Category
          <select name="category" defaultValue={listing?.category ?? listingCategories[0]} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500">
            {listingCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Condition
          <select name="condition" defaultValue={listing?.condition ?? 'good'} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500">
            {listingConditions.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Estimated value (USD)
          <input name="estimated_value" type="number" min={1} defaultValue={listing ? Math.round(listing.estimated_value / 100) : ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          City or neighborhood
          <input name="location_label" defaultValue={listing?.location_label ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          What would you trade for?
          <textarea name="trade_for" defaultValue={listing?.trade_for ?? ''} className="min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Latitude
          <input name="lat" type="number" step="0.0001" defaultValue={listing?.lat ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Longitude
          <input name="lng" type="number" step="0.0001" defaultValue={listing?.lng ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
          <input type="checkbox" name="is_local" defaultChecked={listing?.is_local ?? true} />
          Available for local meetup
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
          <input type="checkbox" name="is_shippable" defaultChecked={listing?.is_shippable ?? false} />
          Available for shipping
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Images
          <input name="images" type="file" accept="image/*" multiple className="w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3" />
        </label>
      </div>

      {images.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-4">
          {images.map((image) => (
            <Image
              key={image.id}
              src={image.url}
              alt=""
              width={320}
              height={320}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-4 text-sm text-stone-500">
          No images uploaded yet.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <FormSubmitButton
          label={mode === 'create' ? 'Create listing' : 'Save changes'}
          pendingLabel={mode === 'create' ? 'Creating listing...' : 'Saving listing...'}
          className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        />
      </div>
    </form>
  )
}
