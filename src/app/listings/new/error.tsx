'use client'

export default function NewListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-950">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-rose-900">
        The listing page hit an unexpected client error. Try again, and if it keeps happening, check the deployment logs for details.
      </p>
      <pre className="whitespace-pre-wrap rounded-2xl border border-rose-200 bg-white/70 p-4 text-xs text-rose-900">
        {error.message}
      </pre>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-rose-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-800"
      >
        Try again
      </button>
    </main>
  )
}

