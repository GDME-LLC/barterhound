'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  createListingAction,
  updateListingAction,
} from '@/app/listings/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'
import { listingCategories, listingConditions } from '@/lib/listing-options'
import { formatCurrency } from '@/lib/format'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Listing, ListingImage } from '@/types'
import type { ListingValueSuggestion } from '@/lib/gemini/schema'

type MapboxPlace = {
  id: string
  place_name: string
  center: [number, number]
}

type ListingFormProps = {
  mode: 'create' | 'edit'
  listing?: Listing | null
  images?: ListingImage[]
}

export function ListingForm({ mode, listing, images = [] }: ListingFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const imagesInputRef = useRef<HTMLInputElement | null>(null)
  const uploadedImagesRef = useRef<HTMLInputElement | null>(null)
  const clientListingIdRef = useRef<HTMLInputElement | null>(null)
  const uploadsInFlightRef = useRef(false)
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<
    { url: string; name: string }[]
  >([])
  const [selectedImageError, setSelectedImageError] = useState<string | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
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
  const [suggestion, setSuggestion] = useState<ListingValueSuggestion | null>(null)
  const [suggestFingerprint, setSuggestFingerprint] = useState<string | null>(null)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestNotice, setSuggestNotice] = useState<string | null>(null)
  const [lastSuggestInputKey, setLastSuggestInputKey] = useState<string | null>(null)
  const [locationQuery, setLocationQuery] = useState(listing?.location_label ?? '')
  const [locationOptions, setLocationOptions] = useState<MapboxPlace[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

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

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const query = locationQuery.trim()

    setLocationError(null)

    if (!token) {
      // Mapbox is optional for the app overall; the map page will warn if absent.
      setLocationOptions([])
      return
    }

    if (query.length < 3) {
      setLocationOptions([])
      return
    }

    setLocationLoading(true)

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query,
        )}.json?types=poi,address,neighborhood,locality,place&limit=5&access_token=${encodeURIComponent(
          token,
        )}`,
        { signal: controller.signal },
      )
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Geocoding failed (${res.status})`)
          }
          return res.json()
        })
        .then((data) => {
          const features = Array.isArray(data?.features) ? (data.features as MapboxPlace[]) : []
          setLocationOptions(features)
        })
        .catch((error) => {
          if (error?.name === 'AbortError') return
          setLocationOptions([])
          setLocationError(error instanceof Error ? error.message : 'Unable to search locations.')
        })
        .finally(() => {
          setLocationLoading(false)
        })
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [locationQuery])

  async function uploadListingImagesClientSide(targetListingId: string, startingPosition: number) {
    const input = imagesInputRef.current
    const out = uploadedImagesRef.current
    if (!input || !out) return { ok: true as const }

    const files = Array.from(input.files ?? []).filter((file) => file.size > 0)
    if (files.length === 0) return { ok: true as const }

    const maxPerFileBytes = 10 * 1024 * 1024
    const maxTotalBytes = 60 * 1024 * 1024
    const tooLarge = files.find((file) => file.size > maxPerFileBytes)
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0)

    if (tooLarge) {
      return { ok: false as const, error: `“${tooLarge.name}” is too large. Please use images under 10MB each.` }
    }

    if (totalBytes > maxTotalBytes) {
      return { ok: false as const, error: 'Selected images total is too large. Keep it under 60MB.' }
    }

    const supabase = createBrowserSupabaseClient()
    if (!supabase) {
      return { ok: false as const, error: 'Supabase is not configured.' }
    }

    setIsUploadingImages(true)
    setImageUploadError(null)

    try {
      const rows: { storage_path: string; url: string; position: number }[] = []

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be signed in.')
      }

      for (const [index, file] of files.entries()) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        // Storage path: <userId>/<listingId>-<timestamp>-<index>.<ext>
        const finalStoragePath = `${user.id}/${targetListingId}-${Date.now()}-${index}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(finalStoragePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data } = supabase.storage.from('listing-images').getPublicUrl(finalStoragePath)
        rows.push({
          storage_path: finalStoragePath,
          url: data.publicUrl,
          position: startingPosition + index,
        })
      }

      out.value = JSON.stringify(rows)
      input.disabled = true

      return { ok: true as const }
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : 'Image upload failed.' }
    } finally {
      setIsUploadingImages(false)
    }
  }

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
    if (aiFingerprintRef.current) aiFingerprintRef.current.value = suggestFingerprint ?? ''

    setSuggestNotice('Applied the suggestion. You can still override the trade value anytime.')
  }

  function readSuggestPayload() {
    const form = formRef.current
    if (!form) return null

    const get = (name: string) =>
      (form.querySelector(`[name="${CSS.escape(name)}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)
        ?.value ?? ''

    const getChecked = (name: string) =>
      (form.querySelector(`[name="${CSS.escape(name)}"]`) as HTMLInputElement | null)?.checked ?? false

    const rawQuantity = get('quantity').trim()
    const quantity = rawQuantity ? Number.parseInt(rawQuantity, 10) : null

    const desired = get('desired_categories')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 8)

    const payload = {
      title: get('title').trim(),
      description: get('description').trim() || null,
      category: get('category'),
      condition: get('condition'),
      brand: get('brand').trim() || null,
      model: get('model').trim() || null,
      quantity: Number.isFinite(quantity) ? quantity : null,
      isBundle: getChecked('is_bundle'),
      desiredCategories: desired.length ? desired : null,
      openToAnything: getChecked('open_to_anything'),
    }

    return payload
  }

  async function handleSuggestValue() {
    setSuggestNotice(null)
    setSuggestError(null)

    const payload = readSuggestPayload()
    if (!payload) {
      setSuggestError('Unable to read listing details.')
      return
    }

    // Lightweight dedupe: avoid re-calling if inputs are identical.
    const inputKey = JSON.stringify(payload)
    if (lastSuggestInputKey && inputKey === lastSuggestInputKey && suggestion) {
      setSuggestNotice('Suggestion is already up to date for the current details.')
      return
    }

    if (payload.title.length < 3) {
      setSuggestError('Add a title first.')
      return
    }

    setSuggestLoading(true)

    try {
      const response = await fetch('/api/listings/suggest-value', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as
        | { suggestion: ListingValueSuggestion; fingerprint: string }
        | { error: string }

      if (!response.ok) {
        throw new Error('error' in data ? data.error : 'Unable to generate suggestion.')
      }

      if (!('suggestion' in data)) {
        throw new Error('Unable to generate suggestion.')
      }

      setSuggestion(data.suggestion)
      setSuggestFingerprint(data.fingerprint)
      setLastSuggestInputKey(inputKey)
    } catch (error) {
      setSuggestError(error instanceof Error ? error.message : 'Unable to generate suggestion.')
    } finally {
      setSuggestLoading(false)
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        if (uploadsInFlightRef.current) return
        if (selectedImageError) return

        const input = imagesInputRef.current
        const files = Array.from(input?.files ?? []).filter((file) => file.size > 0)
        const hasNewImages = files.length > 0

        if (!hasNewImages) return

        event.preventDefault()
        uploadsInFlightRef.current = true

        const listingId =
          mode === 'edit'
            ? listing?.id
            : (clientListingIdRef.current?.value || crypto.randomUUID())

        if (!listingId) {
          setImageUploadError('Unable to prepare listing upload.')
          uploadsInFlightRef.current = false
          return
        }

        if (mode === 'create' && clientListingIdRef.current) {
          clientListingIdRef.current.value = listingId
        }

        const startingPosition = mode === 'edit' ? images.length : 0

        uploadListingImagesClientSide(listingId, startingPosition).then((result) => {
          uploadsInFlightRef.current = false
          if (!result.ok) {
            setImageUploadError(result.error)
            return
          }
          formRef.current?.requestSubmit()
        })
      }}
    >
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
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

      {mode === 'create' ? (
        <input ref={clientListingIdRef} type="hidden" name="client_listing_id" defaultValue="" />
      ) : null}

      <input ref={uploadedImagesRef} type="hidden" name="uploaded_images" defaultValue="" />

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
            ref={imagesInputRef}
            name="images"
            type="file"
            accept="image/*"
            multiple
            required={mode === 'create'}
            disabled={isUploadingImages}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? [])
              const maxPerFileBytes = 10 * 1024 * 1024 // 10MB
              const maxTotalBytes = 60 * 1024 * 1024 // 60MB
              const tooBig = files.find((file) => file.size > maxPerFileBytes)
              const total = files.reduce((sum, file) => sum + file.size, 0)

              if (tooBig) {
                setSelectedImageError(
                  `“${tooBig.name}” is too large. Please use images under 10MB each.`,
                )
              } else if (total > maxTotalBytes) {
                setSelectedImageError('Selected images total is too large. Keep it under 60MB.')
              } else {
                setSelectedImageError(null)
              }
              setImageUploadError(null)

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
          {selectedImageError ? (
            <span className="block text-xs font-normal text-rose-700">
              {selectedImageError}
            </span>
          ) : (
            <span className="block text-xs font-normal text-stone-500">
              Tip: smaller images upload faster and fail less often.
            </span>
          )}
          {imageUploadError ? (
            <span className="block text-xs font-normal text-rose-700">
              {imageUploadError}
            </span>
          ) : null}
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

        <div className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          <label className="block">
            Pickup area (landmark or neighborhood)
            <input
              name="location_label"
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="e.g. Tom's West Bay, Acme Shell Station, Downtown Oakland"
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500"
            />
          </label>
          <input name="lat" type="hidden" defaultValue={listing?.lat ?? ''} />
          <input name="lng" type="hidden" defaultValue={listing?.lng ?? ''} />

          {locationLoading ? (
            <p className="text-xs font-normal text-stone-500">Searching...</p>
          ) : null}

          {locationError ? (
            <p className="text-xs font-normal text-rose-700">{locationError}</p>
          ) : null}

          {locationOptions.length > 0 ? (
            <div className="grid gap-2">
              {locationOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-700 transition hover:border-brand-300 hover:text-brand-700"
                  onClick={() => {
                    const form = formRef.current
                    if (!form) return
                    const latInput = form.querySelector('input[name="lat"]') as HTMLInputElement | null
                    const lngInput = form.querySelector('input[name="lng"]') as HTMLInputElement | null
                    if (latInput) latInput.value = String(option.center?.[1] ?? '')
                    if (lngInput) lngInput.value = String(option.center?.[0] ?? '')
                    setLocationQuery(option.place_name)
                    setLocationOptions([])
                  }}
                >
                  {option.place_name}
                </button>
              ))}
            </div>
          ) : null}

          <span className="block text-xs font-normal text-stone-500">
            Tip: use a nearby landmark or neighborhood. You can set a precise meetup pin later when a trade is agreed.
          </span>
        </div>

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
            type="button"
            onClick={handleSuggestValue}
            disabled={suggestLoading}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {suggestLoading ? 'Thinking...' : suggestion ? 'Suggest again' : 'Suggest value'}
          </button>
        </div>

        {suggestError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Suggestion unavailable: {suggestError}. You can still set your own value.
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
