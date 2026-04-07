'use client'

import { useActionState } from 'react'
import { saveShipmentAction } from '@/app/trades/actions'
import { FormMessage } from '@/components/form-message'
import { FormSubmitButton } from '@/components/form-submit-button'

const shipmentStatuses = [
  'label_created',
  'shipped',
  'in_transit',
  'delivered',
  'exception',
] as const

export function ShipmentForm({
  tradeId,
  direction,
  shipment,
}: {
  tradeId: string
  direction: 'outbound' | 'inbound'
  shipment?: any
}) {
  const [state, formAction] = useActionState(saveShipmentAction, undefined)

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-stone-900">
          {direction === 'outbound' ? 'Outbound shipment' : 'Return shipment'}
        </h3>
        <p className="mt-2 text-sm text-stone-500">
          Enter the latest manual tracking details for this package.
        </p>
      </div>

      <FormMessage state={state} />

      <input type="hidden" name="trade_id" value={tradeId} />
      <input type="hidden" name="direction" value={direction} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Carrier
          <input name="carrier" defaultValue={shipment?.carrier ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Tracking number
          <input name="tracking_number" defaultValue={shipment?.tracking_number ?? ''} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500" />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700 md:col-span-2">
          Status
          <select name="status" defaultValue={shipment?.status ?? 'label_created'} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-brand-500">
            {shipmentStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FormSubmitButton
        label="Save shipment"
        pendingLabel="Saving shipment..."
        className="rounded-full bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      />
    </form>
  )
}
