// Shipment tracking - placeholder for Phase 9
export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Shipment Tracking</h1>
      <p className="mt-2 text-gray-500">Trade id: {id} - Phase 9</p>
    </main>
  )
}
