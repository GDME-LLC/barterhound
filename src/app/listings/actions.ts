'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireProfile } from '@/lib/auth'
import {
  optionalString,
  parseFloatValue,
  parseInteger,
  requireString,
  type ActionState,
} from '@/lib/validation'
import { listingCategories, listingConditions } from '@/lib/listing-options'
import { suggestListingValue } from '@/lib/gemini/suggest'
import type { ListingValueSuggestion } from '@/lib/gemini/schema'
import type { ListingCondition } from '@/types'

function parseCondition(formData: FormData) {
  const value = String(formData.get('condition') ?? '')

  if (!listingConditions.some((condition) => condition.value === value)) {
    throw new Error('Choose a valid listing condition.')
  }

  return value as ListingCondition
}

function parseCategory(formData: FormData) {
  const value = String(formData.get('category') ?? '')

  if (!listingCategories.includes(value as (typeof listingCategories)[number])) {
    throw new Error('Choose a valid category.')
  }

  return value
}

function parseListingInput(formData: FormData) {
  const title = requireString(formData, 'title', 'Title', 3)
  const description = optionalString(formData, 'description')
  const category = parseCategory(formData)
  const condition = parseCondition(formData)
  const tradeValue = parseInteger(formData, 'trade_value', 'Trade value', {
    min: 1,
    required: false,
  })
  const tradeFor = optionalString(formData, 'trade_for')
  const locationLabel = optionalString(formData, 'location_label')
  const lat = parseFloatValue(formData, 'lat', 'Latitude', {
    min: -90,
    max: 90,
    required: false,
  })
  const lng = parseFloatValue(formData, 'lng', 'Longitude', {
    min: -180,
    max: 180,
    required: false,
  })
  const isLocal = formData.get('is_local') === 'on'
  const isShippable = formData.get('is_shippable') === 'on'

  if (!isLocal && !isShippable) {
    throw new Error('Choose at least one trade method.')
  }

  return {
    title,
    description,
    category,
    condition,
    estimated_value: tradeValue ? tradeValue * 100 : null,
    user_selected_trade_value: tradeValue ? tradeValue * 100 : null,
    trade_for: tradeFor,
    location_label: locationLabel,
    lat,
    lng,
    is_local: isLocal,
    is_shippable: isShippable,
  }
}

function parseOptionalJsonStringArray(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '').trim()
  if (!raw) return null

  // Accept either JSON array or comma-separated list.
  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) {
      throw new Error('Desired categories must be a list.')
    }
    return parsed.map((value) => value.trim()).filter(Boolean).slice(0, 8)
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function parseAiValueFields(formData: FormData) {
  const aiConfidence = optionalString(formData, 'ai_confidence')
  if (aiConfidence && !['low', 'medium', 'high'].includes(aiConfidence)) {
    throw new Error('AI confidence must be low, medium, or high.')
  }

  const aiEstimatedLow = parseInteger(formData, 'ai_estimated_low', 'AI low estimate', {
    min: 1,
    required: false,
  })
  const aiEstimatedHigh = parseInteger(formData, 'ai_estimated_high', 'AI high estimate', {
    min: 1,
    required: false,
  })

  return {
    ai_normalized_title: optionalString(formData, 'ai_normalized_title'),
    ai_detected_brand: optionalString(formData, 'ai_detected_brand'),
    ai_detected_model: optionalString(formData, 'ai_detected_model'),
    ai_estimated_low: aiEstimatedLow ? aiEstimatedLow * 100 : null,
    ai_estimated_high: aiEstimatedHigh ? aiEstimatedHigh * 100 : null,
    ai_confidence: aiConfidence,
    ai_explanation: optionalString(formData, 'ai_explanation'),
    ai_valuation_fingerprint: optionalString(formData, 'ai_valuation_fingerprint'),
  }
}

function parseDetailFields(formData: FormData) {
  const brand = optionalString(formData, 'brand')
  const model = optionalString(formData, 'model')
  const quantity = parseInteger(formData, 'quantity', 'Quantity', {
    min: 1,
    max: 99,
    required: false,
  })

  return {
    brand,
    model,
    quantity,
    is_bundle: formData.get('is_bundle') === 'on',
    desired_categories: parseOptionalJsonStringArray(formData, 'desired_categories'),
    open_to_anything: formData.get('open_to_anything') === 'on',
  }
}

export type SuggestValueState = {
  error?: string
  suggestion?: ListingValueSuggestion
  fingerprint?: string
}

export async function suggestListingValueAction(
  _previousState: SuggestValueState | undefined,
  formData: FormData,
): Promise<SuggestValueState> {
  try {
    await requireProfile()

    const title = requireString(formData, 'title', 'Title', 3)
    const category = parseCategory(formData)
    const condition = parseCondition(formData)
    const description = optionalString(formData, 'description')
    const details = parseDetailFields(formData)

    const { suggestion, fingerprint } = await suggestListingValue({
      title,
      description,
      category,
      condition,
      brand: details.brand,
      model: details.model,
      quantity: details.quantity,
      isBundle: details.is_bundle,
      desiredCategories: details.desired_categories,
      openToAnything: details.open_to_anything,
    })

    return { suggestion, fingerprint }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to generate suggestion.',
    }
  }
}

async function uploadListingImages({
  listingId,
  userId,
  files,
  startingPosition,
}: {
  listingId: string
  userId: string
  files: File[]
  startingPosition: number
}) {
  if (files.length === 0) {
    return
  }

  const admin = createAdminClient()

  if (!admin) {
    throw new Error('Image uploads require SUPABASE_SERVICE_ROLE_KEY.')
  }

  const rows = []

  for (const [index, file] of files.entries()) {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const storagePath = `${userId}/${listingId}-${Date.now()}-${index}.${extension}`
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('listing-images')
      .upload(storagePath, bytes, {
        contentType: file.type || 'image/jpeg',
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = admin.storage.from('listing-images').getPublicUrl(storagePath)

    rows.push({
      listing_id: listingId,
      storage_path: storagePath,
      url: data.publicUrl,
      position: startingPosition + index,
    })
  }

  const { error } = await admin.from('listing_images').insert(rows)

  if (error) {
    throw new Error(error.message)
  }
}

export async function createListingAction(
  _previousState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireProfile()
    const values = parseListingInput(formData)
    const details = parseDetailFields(formData)
    const aiValues = parseAiValueFields(formData)
    const imageFiles = formData
      .getAll('images')
      .filter((value): value is File => value instanceof File && value.size > 0)

    if (imageFiles.length < 1) {
      throw new Error('At least 1 photo is required.')
    }

    if (imageFiles.length > 8) {
      throw new Error('You can upload up to 8 images.')
    }

    // Guardrails to avoid platform request limits turning into generic client crashes.
    const maxPerFileBytes = 4 * 1024 * 1024 // 4MB
    const maxTotalBytes = 20 * 1024 * 1024 // 20MB
    const tooLarge = imageFiles.find((file) => file.size > maxPerFileBytes)
    const totalBytes = imageFiles.reduce((sum, file) => sum + file.size, 0)

    if (tooLarge) {
      throw new Error(`“${tooLarge.name}” is too large. Please use images under 4MB each.`)
    }

    if (totalBytes > maxTotalBytes) {
      throw new Error('Selected images total is too large. Keep it under 20MB.')
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        ...values,
        ...details,
        ...aiValues,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (error || !listing) {
      throw new Error(error?.message ?? 'Unable to create listing.')
    }

    await uploadListingImages({
      listingId: listing.id,
      userId: user.id,
      files: imageFiles,
      startingPosition: 0,
    })

    revalidatePath('/dashboard')
    revalidatePath('/listings')
    revalidatePath(`/listings/${listing.id}`)

    return { success: `Listing created:${listing.id}` }
  } catch (error) {
    console.error('createListingAction failed', error)
    return {
      error: error instanceof Error ? error.message : 'Unable to create listing.',
    }
  }
}

export async function updateListingAction(
  _previousState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireProfile()
    const listingId = requireString(formData, 'listing_id', 'Listing')
    const values = parseListingInput(formData)
    const details = parseDetailFields(formData)
    const aiValues = parseAiValueFields(formData)

    const { data: listing } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!listing) {
      throw new Error('Listing not found.')
    }

    const { data: existingImages } = await supabase
      .from('listing_images')
      .select('id')
      .eq('listing_id', listingId)

    const imageFiles = formData
      .getAll('images')
      .filter((value): value is File => value instanceof File && value.size > 0)

    const maxPerFileBytes = 4 * 1024 * 1024 // 4MB
    const maxTotalBytes = 20 * 1024 * 1024 // 20MB
    const tooLarge = imageFiles.find((file) => file.size > maxPerFileBytes)
    const totalBytes = imageFiles.reduce((sum, file) => sum + file.size, 0)

    if (tooLarge) {
      throw new Error(`“${tooLarge.name}” is too large. Please use images under 4MB each.`)
    }

    if (totalBytes > maxTotalBytes) {
      throw new Error('Selected images total is too large. Keep it under 20MB.')
    }

    if ((existingImages?.length ?? 0) + imageFiles.length > 8) {
      throw new Error('Listings can only have up to 8 images.')
    }

    const { error } = await supabase
      .from('listings')
      .update({ ...values, ...details, ...aiValues })
      .eq('id', listingId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    await uploadListingImages({
      listingId,
      userId: user.id,
      files: imageFiles,
      startingPosition: existingImages?.length ?? 0,
    })

    revalidatePath('/dashboard')
    revalidatePath('/listings')
    revalidatePath(`/listings/${listingId}`)
    revalidatePath(`/listings/${listingId}/edit`)

    return { success: 'Listing saved.' }
  } catch (error) {
    console.error('updateListingAction failed', error)
    return {
      error: error instanceof Error ? error.message : 'Unable to update listing.',
    }
  }
}

export async function removeListingAction(formData: FormData) {
  const { supabase, user } = await requireProfile()
  const listingId = requireString(formData, 'listing_id', 'Listing')

  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/listings')
  revalidatePath(`/listings/${listingId}`)
}
