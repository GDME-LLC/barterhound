// Shipment tracking — placeholder for Phase 9
export default function ShipmentPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Shipment Tracking</h1>
      <p className="mt-2 text-gray-500">Trade id: {params.id} — Phase 9</p>
    </main>
  )
}
