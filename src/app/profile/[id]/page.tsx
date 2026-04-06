// User profile — placeholder for Phase 3/7
export default function ProfilePage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">User Profile</h1>
      <p className="mt-2 text-gray-500">User id: {params.id} — Phase 3</p>
    </main>
  )
}
