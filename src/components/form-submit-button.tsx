'use client'

import { useFormStatus } from 'react-dom'

export function FormSubmitButton({
  label,
  pendingLabel,
  className,
  disabled,
}: {
  label: string
  pendingLabel?: string
  className?: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
    >
      {pending ? pendingLabel ?? 'Saving...' : label}
    </button>
  )
}
