import type { ActionState } from '@/lib/validation'

export function FormMessage({ state }: { state?: ActionState | null }) {
  if (!state?.error && !state?.success) {
    return null
  }

  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm ${
        state.error
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {state.error ?? state.success}
    </p>
  )
}
