'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  createListingAction,
  suggestListingValueAction,
  updateListingAction,
  type SuggestValueState,
} from '@/app/listings/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'
import { listingCategories, listingConditions } from '@/lib/listing-options'
import { formatCurrency } from '@/lib/format'
import type { Listing, ListingImage } from '@/types'

type ListingFormProps = {
  mode: 'create' | 'edit'
  listing?: Listing | null
  images?: ListingImage[]
}

export function ListingForm({ mode, listing, images = [] }: ListingFormProps) {
  const router = useRouter()
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<
    { url: string; name: string }[]
  >([])
  const tradeValueRef = useRef<HTMLInputElement | null>(null)
  const aiNormalizedTitleRef = useRef<HTMLInputElement | null>(null)
  const aiDetectedBrandRef = useRef<HTMLInputElement | null>(null)
  const aiDetectedModelRef = useRef<HTMLInputElement | null>(null)
  const aiEstimatedLowRef = useRef<HTMLInputElement | null>(null)
  const aiEstimatedHighRef = useRef<HTMLInputElement | null>(null)
  const aiConfidenceRef = useRef<HTMLInputElement | null>(null)
  const aiExplanationRef = useRef<HTMLInputElement | null>(null)
  const aiFingerprintRef = useRef<HTMLInputElement | null>(null)

  const [state, formAction] = useActionState(
    mode === 'create' ? createListingAction : updateListingAction,
    undefined,
  )
  const [suggestState, suggestAction] = useActionState<SuggestValueState, FormData>(
    suggestListingValueAction,
    {},
  )
  const [suggestNotice, setSuggestNotice] = useState<string | null>(null)

  useEffect(() => {
    if (state?.success?.startsWith('Listing created:')) {
      const listingId = state.success.split(':')[1]
      router.push(`/listings/${listingId}`)
    }
  }, [router, state])

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [selectedImagePreviews])

  const suggestion = suggestState?.suggestion

  const suggestionRange = useMemo(() => {
    if (!suggestion?.estimatedLow || !suggestion?.estimatedHigh) return null
    return {
      low: suggestion.estimatedLow * 100,
      high: suggestion.estimatedHigh * 100,
      midpoint: Math.round(((suggestion.estimatedLow + suggestion.estimatedHigh) / 2) * 100),
    }
  }, [suggestion])

  function applySuggestionToForm() {
    if (!suggestion || !suggestionRange) return

    if (tradeValueRef.current) {
      tradeValueRef.current.value = String(Math.max(1, Math.round(suggestionRange.midpoint / 100)))
    }

    if (aiNormalizedTitleRef.current) aiNormalizedTitleRef.current.value = suggestion.normalizedTitle
    if (aiDetectedBrandRef.current) aiDetectedBrandRef.current.value = suggestion.detectedBrand ?? ''
    if (aiDetectedModelRef.current) aiDetectedModelRef.current.value = suggestion.detectedModel ?? ''
    if (aiEstimatedLowRef.current) aiEstimatedLowRef.current.value = String(suggestion.estimatedLow ?? '')
    if (aiEstimatedHighRef.current) aiEstimatedHighRef.current.value = String(suggestion.estimatedHigh ?? '')
    if (aiConfidenceRef.current) aiConfidenceRef.current.value = suggestion.confidence
    if (aiExplanationRef.current) aiExplanationRef.current.value = suggestion.explanation
    if (aiFingerprintRef.current) aiFingerprintRef.current.value = suggestState?.fingerprint ?? ''

    setSuggestNotice('Applied the suggestion. You can still override the trade value anytime.')
  }

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

      <input ref={aiNormalizedTitleRef} type="hidden" name="ai_normalized_title" defaultValue={listing?.ai_normalized_title ?? ''} />
      <input ref={aiDetectedBrandRef} type="hidden" name="ai_detected_brand" defaultValue={listing?.ai_detected_brand ?? ''} />
      <input ref={aiDetectedModelRef} type="hidden" name="ai_detected_model" defaultValue={listing?.ai_detected_model ?? ''} />
      <input ref={aiEstimatedLowRef} type="hidden" name="ai_estimated_low" defaultValue={listing?.ai_estimated_low ? String(Math.round(listing.ai_estimated_low / 100)) : ''} />
      <input ref={aiEstimatedHighRef} type="hidden" name="ai_estimated_high" defaultValue={listing?.ai_estimated_high ? String(Math.round(listing.ai_estimated_high / 100)) : ''} />
      <input ref={aiConfidenceRef} type="hidden" name="ai_confidence" defaultValue={listing?.ai_confidence ?? ''} />
      <input ref={aiExplanationRef} type="hidden" name="ai_explanation" defaultValue={listing?.ai_explanation ?? ''} />
      <input ref={aiFingerprintRef} type="hidden" name="ai_valuation_fingerprint" defaultValue={listing?.ai_valuation_fingerprint ?? ''} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Photos
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            required={mode === 'create'}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? [])
              setSelectedImagePreviews((current) => {
                current.forEach((preview) => URL.revokeObjectURL(preview.url))
                return files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }))
              })
            }}
            className="w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3"
          />
          <span className="block text-xs font-normal text-stone-500">
            At least 1 photo is required to create a listing.
          </span>
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Title
          <input name="title" defaultValue={listing?.title ?? ''} required minLength={3} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Description
          <textarea name="description" defaultValue={listing?.description ?? ''} className="min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
          <span className="block text-xs font-normal text-stone-500">
            Optional. Add details that help someone propose a fair trade.
          </span>
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
          Brand (optional)
          <input name="brand" defaultValue={listing?.brand ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Model (optional)
          <input name="model" defaultValue={listing?.model ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Quantity (optional)
          <input name="quantity" type="number" min={1} max={99} defaultValue={listing?.quantity ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
          <input type="checkbox" name="is_bundle" defaultChecked={listing?.is_bundle ?? false} />
          Bundle / lot
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Desired categories (optional)
          <input
            name="desired_categories"
            defaultValue={listing?.desired_categories?.join(', ') ?? ''}
            placeholder="e.g. Electronics, Sports"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
          />
          <span className="block text-xs font-normal text-stone-500">
            Comma-separated. Leave blank if you are open to anything.
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 md:col-span-2">
          <input type="checkbox" name="open_to_anything" defaultChecked={listing?.open_to_anything ?? false} />
          Open to anything
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
          <input type="checkbox" name="is_local" defaultChecked={listing?.is_local ?? true} />
          Available for local meetup
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
          <input type="checkbox" name="is_shippable" defaultChecked={listing?.is_shippable ?? false} />
          Available for shipping
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          City or neighborhood
          <input name="location_label" defaultValue={listing?.location_label ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Latitude
          <input name="lat" type="number" step="0.0001" defaultValue={listing?.lat ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Longitude
          <input name="lng" type="number" step="0.0001" defaultValue={listing?.lng ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          What would you trade for?
          <textarea name="trade_for" defaultValue={listing?.trade_for ?? ''} className="min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>
      </div>

      <section className="space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Trade value</h2>
            <p className="mt-1 text-sm text-stone-600">
              Used to help find fair trades. This is guidance, not a guarantee.
            </p>
          </div>
          <button
            type="submit"
            formAction={suggestAction}
            formNoValidate
            onClick={(event) => {
              setSuggestNotice(null)
              const existingFingerprint = aiFingerprintRef.current?.value
              if (suggestion && suggestState?.fingerprint && existingFingerprint === suggestState.fingerprint) {
                event.preventDefault()
                setSuggestNotice('Suggestion is already up to date for the current details.')
              }
            }}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {suggestion ? 'Suggest again' : 'Suggest value'}
          </button>
        </div>

        {suggestState?.error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Suggestion unavailable: {suggestState.error}. You can still set your own value.
          </div>
        ) : null}

        {suggestNotice ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {suggestNotice}
          </div>
        ) : null}

        {suggestion ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Suggested trade value</p>
                {suggestionRange ? (
                  <p className="mt-1 text-2xl font-semibold text-stone-900">
                    {formatCurrency(suggestionRange.low)} to {formatCurrency(suggestionRange.high)}
                  </p>
                ) : (
                  <p className="mt-1 text-2xl font-semibold text-stone-900">Need more details</p>
                )}
              </div>
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
                  suggestion.confidence === 'high'
                    ? 'bg-emerald-100 text-emerald-800'
                    : suggestion.confidence === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800',
                ].join(' ')}
              >
                {suggestion.confidence} confidence
              </span>
            </div>

            <p className="mt-3 text-sm text-stone-600">{suggestion.explanation}</p>

            {suggestion.confidence === 'low' && suggestion.followUpQuestions?.length ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-sm font-medium text-stone-800">Quick questions (optional)</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-stone-700">
                  {suggestion.followUpQuestions.slice(0, 3).map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={applySuggestionToForm}
                disabled={!suggestionRange}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                Use suggestion
              </button>
              <p className="self-center text-xs text-stone-500">
                You always have the final say.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
            Not sure what to ask for? Add a few details and click “Suggest value”.
          </div>
        )}

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Trade value (your call)
          <input
            ref={tradeValueRef}
            name="trade_value"
            type="number"
            min={1}
            defaultValue={listing?.user_selected_trade_value ? Math.round(listing.user_selected_trade_value / 100) : (listing?.estimated_value ? Math.round(listing.estimated_value / 100) : '')}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-brand-500"
          />
          <span className="block text-xs font-normal text-stone-500">
            Optional. Enter what you think is fair in USD (whole dollars).
          </span>
        </label>
      </section>

      {selectedImagePreviews.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-4">
          {selectedImagePreviews.map((preview) => (
            <Image
              key={preview.url}
              src={preview.url}
              alt={preview.name}
              width={320}
              height={320}
              unoptimized
              className="aspect-square w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : images.length > 0 ? (
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
