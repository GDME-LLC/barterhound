// Credits and equity are intentionally written through explicit application
// logic rather than triggers so every ledger mutation has a visible call site.

export async function getAvailableCredits(supabase: any, userId: string) {
  const { data } = await supabase
    .from('credit_ledger')
    .select('amount')
    .eq('user_id', userId)

  return (data ?? []).reduce((sum: number, row: { amount: number }) => sum + row.amount, 0)
}

export async function applyAcceptedOfferCredits(supabase: any, offer: any) {
  if (!offer.credits_offered || offer.credits_offered <= 0) {
    return
  }

  const existing = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('ref_id', offer.id)
    .eq('type', 'spend')

  if ((existing.data ?? []).length > 0) {
    return
  }

  await supabase.from('credit_ledger').insert([
    {
      user_id: offer.from_user_id,
      amount: -offer.credits_offered,
      type: 'spend',
      description: 'Credits committed when an offer was accepted.',
      ref_id: offer.id,
    },
    {
      user_id: offer.to_user_id,
      amount: offer.credits_offered,
      type: 'earn',
      description: 'Credits received from an accepted offer.',
      ref_id: offer.id,
    },
  ])
}

export async function refundAcceptedOfferCredits(supabase: any, trade: any, offer: any) {
  if (!offer.credits_offered || offer.credits_offered <= 0) {
    return
  }

  const existing = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('ref_id', trade.id)
    .eq('type', 'refund')

  if ((existing.data ?? []).length > 0) {
    return
  }

  await supabase.from('credit_ledger').insert([
    {
      user_id: offer.from_user_id,
      amount: offer.credits_offered,
      type: 'refund',
      description: 'Credits returned after a cancelled or disputed trade.',
      ref_id: trade.id,
    },
    {
      user_id: offer.to_user_id,
      amount: -offer.credits_offered,
      type: 'adjustment',
      description: 'Credit reversal after a cancelled or disputed trade.',
      ref_id: trade.id,
    },
  ])
}

export async function applyTradeEquity(supabase: any, trade: any, offer: any, offerItems: any[]) {
  const existing = await supabase
    .from('equity_ledger')
    .select('id')
    .eq('trade_id', trade.id)

  if ((existing.data ?? []).length > 0) {
    return
  }

  const targetListingValue = offer.listing?.estimated_value ?? 0
  const offeredItemsValue = (offerItems ?? []).reduce(
    (sum: number, item: { estimated_value: number }) => sum + item.estimated_value,
    0,
  )
  const offeredTotal = offeredItemsValue + (offer.credits_offered ?? 0)

  // Positive equity means the user gave up more estimated value than they
  // received. We mirror the delta for both participants for a full audit trail.
  const initiatorDelta = offeredTotal - targetListingValue
  const receiverDelta = -initiatorDelta

  await supabase.from('equity_ledger').insert([
    {
      user_id: trade.initiator_id,
      amount: initiatorDelta,
      description: 'Equity delta recorded when the trade was completed.',
      trade_id: trade.id,
    },
    {
      user_id: trade.receiver_id,
      amount: receiverDelta,
      description: 'Counterparty equity delta recorded when the trade was completed.',
      trade_id: trade.id,
    },
  ])
}
