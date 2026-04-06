// Edit listing — placeholder for Phase 4
export default function EditListingPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Edit Listing</h1>
      <p className="mt-2 text-gray-500">id: {params.id} — Phase 4</p>
    </main>
  )
}
