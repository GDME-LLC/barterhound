export default function Loading() {
  return (
    <main className="space-y-6">
      <section className="h-48 animate-pulse rounded-[2rem] bg-stone-200" />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="h-56 animate-pulse rounded-3xl bg-stone-200" />
        <div className="h-56 animate-pulse rounded-3xl bg-stone-200" />
        <div className="h-56 animate-pulse rounded-3xl bg-stone-200" />
      </section>
    </main>
  )
}
