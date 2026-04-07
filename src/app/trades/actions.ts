'use server'

import { revalidatePath } from 'next/cache'
import { requireProfile } from '@/lib/auth'
import { applyTradeEquity, refundAcceptedOfferCredits } from '@/lib/ledger'
import {
  optionalString,
  parseInteger,
  requireString,
  type ActionState,
} from '@/lib/validation'

const allowedTransitions: Record<string, string[]> = {
  agreed: ['in_progress', 'cancelled', 'disputed'],
  in_progress: ['completed', 'cancelled', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: [],
}

export async function updateTradeStatusAction(formData: FormData) {
  const { supabase, user } = await requireProfile()
  const tradeId = requireString(formData, 'trade_id', 'Trade')
  const nextStatus = requireString(formData, 'status', 'Status')

  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .maybeSingle()

  if (!trade) {
    throw new Error('Trade not found.')
  }

  if (!allowedTransitions[trade.status]?.includes(nextStatus)) {
    throw new Error('That trade transition is not allowed.')
  }

  const update: Record<string, string | null> = { status: nextStatus }

  if (nextStatus === 'completed') {
    update.completed_at = new Date().toISOString()
  }

  if (nextStatus === 'cancelled') {
    update.cancelled_at = new Date().toISOString()
  }

  if (nextStatus === 'disputed') {
    update.disputed_at = new Date().toISOString()
  }

  const { error } = await supabase.from('trades').update(update).eq('id', tradeId)

  if (error) {
    throw new Error(error.message)
  }

  if (nextStatus === 'cancelled' || nextStatus === 'disputed') {
    const { data: offer } = await supabase
      .from('offers')
      .select('*')
      .eq('id', trade.offer_id)
      .maybeSingle()
    const { data: offerItems } = await supabase
      .from('offer_items')
      .select('listing_id')
      .eq('offer_id', trade.offer_id)

    if (offer?.listing_id) {
      await supabase.from('listings').update({ status: 'active' }).eq('id', offer.listing_id)
    }

    if (offer) {
      await refundAcceptedOfferCredits(supabase, trade, offer)
    }

    if (offerItems && offerItems.length > 0) {
      await supabase
        .from('listings')
        .update({ status: 'active' })
        .in('id', offerItems.map((item) => item.listing_id))
    }
  }

  if (nextStatus === 'completed') {
    const { data: offer } = await supabase
      .from('offers')
      .select('*, listing:listings(*)')
      .eq('id', trade.offer_id)
      .maybeSingle()
    const { data: offerItems } = await supabase
      .from('offer_items')
      .select('listing_id')
      .eq('offer_id', trade.offer_id)

    if (offer?.listing_id) {
      await supabase.from('listings').update({ status: 'traded' }).eq('id', offer.listing_id)
    }

    if (offerItems && offerItems.length > 0) {
      await supabase
        .from('listings')
        .update({ status: 'traded' })
        .in('id', offerItems.map((item) => item.listing_id))
    }

    if (offer) {
      const { data: equityItems } = await supabase
        .from('offer_items')
        .select('estimated_value')
        .eq('offer_id', trade.offer_id)

      await applyTradeEquity(supabase, trade, offer, equityItems ?? [])
    }
  }

  revalidatePath('/offers')
  revalidatePath(`/trades/${tradeId}/shipment`)
  revalidatePath(`/profile/${trade.initiator_id}`)
  revalidatePath(`/profile/${trade.receiver_id}`)
}

export async function createReviewAction(
  _previousState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireProfile()
    const tradeId = requireString(formData, 'trade_id', 'Trade')
    const revieweeId = requireString(formData, 'reviewee_id', 'Reviewee')
    const rating = parseInteger(formData, 'rating', 'Rating', { min: 1, max: 5 }) ?? 5
    const reliabilityScore =
      parseInteger(formData, 'reliability_score', 'Reliability score', {
        min: 1,
        max: 5,
      }) ?? 5
    const comment = optionalString(formData, 'comment')

    const { data: trade } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .maybeSingle()

    if (!trade || trade.status !== 'completed') {
      throw new Error('Reviews are only available after completion.')
    }

    const { error } = await supabase.from('reviews').insert({
      trade_id: tradeId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      reliability_score: reliabilityScore,
      comment,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/trades/${tradeId}/shipment`)
    revalidatePath(`/profile/${revieweeId}`)

    return { success: 'Review submitted.' }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to submit review.',
    }
  }
}

export async function saveShipmentAction(
  _previousState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireProfile()
    const tradeId = requireString(formData, 'trade_id', 'Trade')
    const direction = requireString(formData, 'direction', 'Direction')
    const carrier = requireString(formData, 'carrier', 'Carrier')
    const trackingNumber = requireString(formData, 'tracking_number', 'Tracking number')
    const status = requireString(formData, 'status', 'Status')

    const { data: trade } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .maybeSingle()

    if (!trade || trade.type !== 'shipped') {
      throw new Error('Shipment updates are only available for shipped trades.')
    }

    const payload = {
      trade_id: tradeId,
      direction,
      carrier,
      tracking_number: trackingNumber,
      status,
      shipped_at: status === 'shipped' || status === 'in_transit' || status === 'delivered'
        ? new Date().toISOString()
        : null,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('shipments').upsert(payload, {
      onConflict: 'trade_id,direction',
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/trades/${tradeId}/shipment`)
    return { success: 'Shipment saved.' }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to save shipment.',
    }
  }
}
