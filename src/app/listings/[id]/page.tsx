// Listing detail - placeholder for Phase 4
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Listing Detail</h1>
      <p className="mt-2 text-gray-500">id: {id} - Phase 4</p>
    </main>
  )
}
