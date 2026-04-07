import { notFound } from 'next/navigation'
import { ListingForm } from '@/components/listing-form'
import { requireProfile } from '@/lib/auth'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, user } = await requireProfile()

  const [{ data: listing }, { data: images }] = await Promise.all([
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', id)
      .order('position', { ascending: true }),
  ])

  if (!listing) {
    notFound()
  }

  return (
    <main>
      <ListingForm mode="edit" listing={listing} images={images ?? []} />
    </main>
  )
}
