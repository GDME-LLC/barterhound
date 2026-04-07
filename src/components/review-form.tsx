'use client'

import { useActionState } from 'react'
import { createReviewAction } from '@/app/trades/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'

export function ReviewForm({
  tradeId,
  revieweeId,
}: {
  tradeId: string
  revieweeId: string
}) {
  const [state, formAction] = useActionState(createReviewAction, undefined)

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-stone-900">Leave a review</h3>
        <p className="mt-2 text-sm text-stone-500">
          Rate the trade experience and your partner&apos;s follow-through.
        </p>
      </div>

      <FormMessage state={state} />

      <input type="hidden" name="trade_id" value={tradeId} />
      <input type="hidden" name="reviewee_id" value={revieweeId} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Overall rating
          <input name="rating" type="number" min={1} max={5} defaultValue={5} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Reliability score
          <input name="reliability_score" type="number" min={1} max={5} defaultValue={5} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-stone-700">
        Comment
        <textarea name="comment" className="min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
      </label>

      <FormSubmitButton
        label="Submit review"
        pendingLabel="Submitting review..."
        className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      />
    </form>
  )
}
