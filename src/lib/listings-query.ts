import { createClient } from '@/lib/supabase/server'

export type ListingFilters = {
  query?: string
  category?: string
  condition?: string
  trade?: string
  min?: string
  max?: string
}

export async function getBrowseListings(filters: ListingFilters = {}) {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  let query = supabase
    .from('listings')
    .select('*, profiles(*), listing_images(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,trade_for.ilike.%${filters.query}%`,
    )
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.condition) {
    query = query.eq('condition', filters.condition)
  }

  if (filters.trade === 'local') {
    query = query.eq('is_local', true)
  }

  if (filters.trade === 'shipping') {
    query = query.eq('is_shippable', true)
  }

  if (filters.min) {
    query = query.gte('estimated_value', Number(filters.min) * 100)
  }

  if (filters.max) {
    query = query.lte('estimated_value', Number(filters.max) * 100)
  }

  const { data } = await query.limit(48)
  return data ?? []
}
