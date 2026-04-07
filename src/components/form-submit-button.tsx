'use client'

import { useFormStatus } from 'react-dom'

export function FormSubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string
  pendingLabel?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
    >
      {pending ? pendingLabel ?? 'Saving...' : label}
    </button>
  )
}
