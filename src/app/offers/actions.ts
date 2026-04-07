'use server'

import { revalidatePath } from 'next/cache'
import { requireProfile } from '@/lib/auth'
import { applyAcceptedOfferCredits, getAvailableCredits } from '@/lib/ledger'
import {
  optionalString,
  parseInteger,
  requireString,
  type ActionState,
} from '@/lib/validation'

async function expireStaleOffers(supabase: any) {
  await supabase
    .from('offers')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
}

export async function createOfferAction(
  _previousState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireProfile()
    const listingId = requireString(formData, 'listing_id', 'Listing')
    const parentOfferId = optionalString(formData, 'parent_offer_id')
    const selectedListingIds = formData.getAll('offer_listing_ids').map(String)
    const message = optionalString(formData, 'message')
    const creditsOffered = parseInteger(formData, 'credits_offered', 'Credits', {
      min: 0,
      required: false,
    }) ?? 0

    if (selectedListingIds.length === 0 && creditsOffered === 0) {
      throw new Error('Select at least one of your listings or include credits.')
    }

    const availableCredits = await getAvailableCredits(supabase, user.id)

    if (creditsOffered > availableCredits) {
      throw new Error('You do not have enough credits for this offer.')
    }

    const { data: targetListing } = await supabase
      .from('listings')
      .select('id, user_id, status')
      .eq('id', listingId)
      .maybeSingle()

    if (!targetListing || targetListing.status !== 'active') {
      throw new Error('This listing is not available for offers.')
    }

    if (targetListing.user_id === user.id) {
      throw new Error('You cannot make an offer on your own listing.')
    }

    const { data: senderListings } = await supabase
      .from('listings')
      .select('id, estimated_value, status')
      .eq('user_id', user.id)
      .in('id', selectedListingIds)

    if ((senderListings?.length ?? 0) !== selectedListingIds.length) {
      throw new Error('One or more selected listings are unavailable.')
    }

    if ((senderListings ?? []).some((listing) => listing.status !== 'active')) {
      throw new Error('Only active listings can be included in an offer.')
    }

    let rootOfferId: string | null = null

    if (parentOfferId) {
      const { data: parentOffer } = await supabase
        .from('offers')
        .select('id, root_offer_id, from_user_id, to_user_id, listing_id')
        .eq('id', parentOfferId)
        .maybeSingle()

      if (!parentOffer) {
        throw new Error('Parent offer not found.')
      }

      rootOfferId = parentOffer.root_offer_id ?? parentOffer.id
    }

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        root_offer_id: rootOfferId,
        parent_offer_id: parentOfferId,
        from_user_id: user.id,
        to_user_id: targetListing.user_id,
        listing_id: listingId,
        message,
        credits_offered: creditsOffered,
      })
      .select('id')
      .single()

    if (error || !offer) {
      throw new Error(error?.message ?? 'Unable to create offer.')
    }

    const offerItems = (senderListings ?? []).map((listing) => ({
      offer_id: offer.id,
      listing_id: listing.id,
      estimated_value: listing.estimated_value,
    }))

    if (offerItems.length > 0) {
      const { error: itemError } = await supabase.from('offer_items').insert(offerItems)

      if (itemError) {
        throw new Error(itemError.message)
      }
    }

    revalidatePath('/offers')
    revalidatePath('/listings')
    revalidatePath(`/listings/${listingId}`)

    return { success: `Offer created:${offer.id}` }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to create offer.',
    }
  }
}

export async function acceptOfferAction(formData: FormData) {
  const { supabase, user } = await requireProfile()
  const offerId = requireString(formData, 'offer_id', 'Offer')
  const tradeType = requireString(formData, 'trade_type', 'Trade type')

  await expireStaleOffers(supabase)

  const { data: offer } = await supabase
    .from('offers')
    .select('*, listing:listings(*)')
    .eq('id', offerId)
    .eq('to_user_id', user.id)
    .maybeSingle()

  if (!offer || offer.status !== 'pending') {
    throw new Error('Offer is no longer available.')
  }

  const listing = Array.isArray(offer.listing) ? offer.listing[0] : offer.listing

  if (!listing) {
    throw new Error('Listing not found for this offer.')
  }

  const { error: tradeError } = await supabase.from('trades').insert({
    offer_id: offer.id,
    initiator_id: offer.from_user_id,
    receiver_id: offer.to_user_id,
    type: tradeType,
    status: 'agreed',
  })

  if (tradeError) {
    throw new Error(tradeError.message)
  }

  await applyAcceptedOfferCredits(supabase, offer)

  await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
  await supabase
    .from('offers')
    .update({ status: 'expired' })
    .eq('listing_id', offer.listing_id)
    .eq('status', 'pending')
    .neq('id', offer.id)
  await supabase
    .from('listings')
    .update({ status: 'pending' })
    .in('id', [offer.listing_id])
  await supabase
    .from('offer_items')
    .select('listing_id')
    .eq('offer_id', offer.id)

  const { data: items } = await supabase
    .from('offer_items')
    .select('listing_id')
    .eq('offer_id', offer.id)

  if (items && items.length > 0) {
    await supabase
      .from('listings')
      .update({ status: 'pending' })
      .in('id', items.map((item) => item.listing_id))
  }

  revalidatePath('/offers')
  revalidatePath('/dashboard')
  revalidatePath(`/profile/${offer.from_user_id}`)
  revalidatePath(`/profile/${offer.to_user_id}`)
}

export async function updateOfferStatusAction(formData: FormData) {
  const { supabase, user } = await requireProfile()
  const offerId = requireString(formData, 'offer_id', 'Offer')
  const status = requireString(formData, 'status', 'Status')

  if (!['rejected', 'cancelled'].includes(status)) {
    throw new Error('Invalid offer action.')
  }

  const column = status === 'cancelled' ? 'from_user_id' : 'to_user_id'

  const { error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', offerId)
    .eq(column, user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/offers')
}
