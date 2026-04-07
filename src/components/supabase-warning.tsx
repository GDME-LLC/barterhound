export function SupabaseWarning() {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h2 className="text-xl font-semibold">Supabase setup required</h2>
      <p className="mt-2 text-sm text-amber-900">
        Add the environment variables from `.env.example`, apply the Phase 2
        migration, create the `listing-images` and `avatars` buckets, and add
        your local auth callback URL before using signed-in flows.
      </p>
    </section>
  )
}
