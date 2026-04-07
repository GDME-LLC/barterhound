import { redirect } from 'next/navigation'
import { OfferForm } from '@/components/offer-form'
import { requireProfile } from '@/lib/auth'

export default async function NewOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; parent?: string }>
}) {
  const { listing: listingId, parent } = await searchParams
  const { supabase, user } = await requireProfile()

  if (!listingId) {
    redirect('/listings')
  }

  const [{ data: listing }, { data: ownedListings }] = await Promise.all([
    supabase.from('listings').select('*').eq('id', listingId).maybeSingle(),
    supabase
      .from('listings')
      .select('id, title, category, estimated_value, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  if (!listing) {
    redirect('/listings')
  }

  return (
    <main>
      <OfferForm listing={listing} ownedListings={ownedListings ?? []} parentOfferId={parent} />
    </main>
  )
}
