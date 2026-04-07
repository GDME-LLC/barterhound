import { ListingForm } from '@/components/listing-form'
import { requireProfile } from '@/lib/auth'

export default async function NewListingPage() {
  await requireProfile()

  return (
    <main>
      <ListingForm mode="create" />
    </main>
  )
}
