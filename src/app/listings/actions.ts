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

function parseCondition(formData: FormData) {
  const value = String(formData.get('condition') ?? '')

  if (!listingConditions.some((condition) => condition.value === value)) {
    throw new Error('Choose a valid listing condition.')
  }

  return value
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
  const description = requireString(formData, 'description', 'Description', 10)
  const category = parseCategory(formData)
  const condition = parseCondition(formData)
  const estimatedValue = parseInteger(formData, 'estimated_value', 'Estimated value', {
    min: 1,
  }) ?? 0
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
    estimated_value: estimatedValue * 100,
    trade_for: tradeFor,
    location_label: locationLabel,
    lat,
    lng,
    is_local: isLocal,
    is_shippable: isShippable,
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
    const bytes = Buffer.from(await file.arrayBuffer())

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
    const imageFiles = formData
      .getAll('images')
      .filter((value): value is File => value instanceof File && value.size > 0)

    if (imageFiles.length > 8) {
      throw new Error('You can upload up to 8 images.')
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        ...values,
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

    if ((existingImages?.length ?? 0) + imageFiles.length > 8) {
      throw new Error('Listings can only have up to 8 images.')
    }

    const { error } = await supabase
      .from('listings')
      .update(values)
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
