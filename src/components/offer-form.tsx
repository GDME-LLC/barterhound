'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOfferAction } from '@/app/offers/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'
import { formatCurrency } from '@/lib/format'

export function OfferForm({
  listing,
  ownedListings,
  parentOfferId,
}: {
  listing: any
  ownedListings: any[]
  parentOfferId?: string
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(createOfferAction, undefined)

  useEffect(() => {
    if (state?.success?.startsWith('Offer created:')) {
      router.push('/offers')
    }
  }, [router, state])

  return (
    <form action={formAction} className="space-y-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Build an offer</h1>
        <p className="mt-2 text-sm text-stone-500">
          Offer one or more of your active listings, optional credits, and a short message.
        </p>
      </div>

      <FormMessage state={state} />

      <input type="hidden" name="listing_id" value={listing.id} />
      <input type="hidden" name="parent_offer_id" value={parentOfferId ?? ''} />

      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <p className="text-sm text-stone-500">Requested listing</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">{listing.title}</h2>
        <p className="mt-2 text-sm text-stone-500">{listing.description}</p>
        <p className="mt-4 text-sm font-medium text-brand-700">
          Estimated value: {formatCurrency(listing.estimated_value)}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-stone-900">Select your listings</h3>
        {ownedListings.length > 0 ? (
          ownedListings.map((ownedListing) => (
            <label key={ownedListing.id} className="flex items-start gap-3 rounded-2xl border border-stone-200 px-4 py-4">
              <input type="checkbox" name="offer_listing_ids" value={ownedListing.id} className="mt-1" />
              <span>
                <span className="block font-medium text-stone-900">{ownedListing.title}</span>
                <span className="mt-1 block text-sm text-stone-500">
                  {ownedListing.category} · {formatCurrency(ownedListing.estimated_value)}
                </span>
              </span>
            </label>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
            You need at least one active listing before you can barter.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Optional credits
          <input name="credits_offered" type="number" min={0} defaultValue={0} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Message
          <textarea name="message" className="min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" placeholder="Describe why this trade is a fit." />
        </label>
      </div>

      <FormSubmitButton
        label="Send offer"
        pendingLabel="Sending offer..."
        className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      />
    </form>
  )
}
