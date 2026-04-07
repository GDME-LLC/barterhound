import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename)

  if (!fs.existsSync(filePath)) {
    return
  }

  const contents = fs.readFileSync(filePath, 'utf8')

  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const demoUsers = [
  {
    email: 'alice.demo@barterhound.local',
    password: 'BarterHound123!',
    username: 'alice-demo',
    display_name: 'Alice Demo',
    location_label: 'Brooklyn, NY',
    lat: 40.6782,
    lng: -73.9442,
  },
  {
    email: 'marco.demo@barterhound.local',
    password: 'BarterHound123!',
    username: 'marco-demo',
    display_name: 'Marco Demo',
    location_label: 'Jersey City, NJ',
    lat: 40.7178,
    lng: -74.0431,
  },
  {
    email: 'riley.demo@barterhound.local',
    password: 'BarterHound123!',
    username: 'riley-demo',
    display_name: 'Riley Demo',
    location_label: 'Queens, NY',
    lat: 40.7282,
    lng: -73.7949,
  },
]

async function ensureDemoUser(definition) {
  const existingUsers = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  const existing = existingUsers.data.users.find((user) => user.email === definition.email)

  if (existing) {
    return existing
  }

  const created = await supabase.auth.admin.createUser({
    email: definition.email,
    password: definition.password,
    email_confirm: true,
  })

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? `Unable to create ${definition.email}`)
  }

  return created.data.user
}

const createdUsers = []

for (const user of demoUsers) {
  createdUsers.push(await ensureDemoUser(user))
}

const userIds = createdUsers.map((user) => user.id)

await supabase.from('reviews').delete().in('reviewer_id', userIds)
await supabase.from('equity_ledger').delete().in('user_id', userIds)
await supabase.from('credit_ledger').delete().in('user_id', userIds)
await supabase.from('trades').delete().or(
  userIds.map((id) => `initiator_id.eq.${id}`).concat(userIds.map((id) => `receiver_id.eq.${id}`)).join(','),
)
await supabase.from('offers').delete().or(
  userIds.map((id) => `from_user_id.eq.${id}`).concat(userIds.map((id) => `to_user_id.eq.${id}`)).join(','),
)
await supabase.from('listings').delete().in('user_id', userIds)

await supabase.from('profiles').upsert(
  createdUsers.map((user, index) => ({
    id: user.id,
    username: demoUsers[index].username,
    display_name: demoUsers[index].display_name,
    bio: 'Demo account for local BarterHound exploration.',
    location_label: demoUsers[index].location_label,
    lat: demoUsers[index].lat,
    lng: demoUsers[index].lng,
    trade_radius_km: 25,
  })),
)

const { data: listings, error: listingError } = await supabase
  .from('listings')
  .insert([
    {
      user_id: createdUsers[0].id,
      title: 'Vintage road bike',
      description: 'Steel-frame commuter bike in good condition with a new saddle.',
      category: 'Sports',
      condition: 'good',
      estimated_value: 35000,
      trade_for: 'Laptop gear, music equipment, or quality tools.',
      is_local: true,
      is_shippable: false,
      location_label: demoUsers[0].location_label,
      lat: demoUsers[0].lat,
      lng: demoUsers[0].lng,
      status: 'active',
    },
    {
      user_id: createdUsers[1].id,
      title: 'Mechanical keyboard kit',
      description: 'Hot-swappable keyboard with tactile switches and carrying case.',
      category: 'Electronics',
      condition: 'like_new',
      estimated_value: 18000,
      trade_for: 'Bike parts, headphones, or local coffee gear.',
      is_local: true,
      is_shippable: true,
      location_label: demoUsers[1].location_label,
      lat: demoUsers[1].lat,
      lng: demoUsers[1].lng,
      status: 'active',
    },
    {
      user_id: createdUsers[2].id,
      title: 'Compact espresso setup',
      description: 'Manual grinder, scale, and brewer for a small apartment coffee corner.',
      category: 'Home',
      condition: 'good',
      estimated_value: 22000,
      trade_for: 'Keyboard kit, bike accessories, or camping gear.',
      is_local: true,
      is_shippable: true,
      location_label: demoUsers[2].location_label,
      lat: demoUsers[2].lat,
      lng: demoUsers[2].lng,
      status: 'active',
    },
  ])
  .select('*')

if (listingError || !listings) {
  throw new Error(listingError?.message ?? 'Unable to seed listings.')
}

const [bikeListing, keyboardListing, coffeeListing] = listings

const { data: pendingOffer } = await supabase
  .from('offers')
  .insert({
    from_user_id: createdUsers[1].id,
    to_user_id: createdUsers[0].id,
    listing_id: bikeListing.id,
    message: 'Happy to trade the keyboard kit and add credits for the bike.',
    credits_offered: 3000,
    status: 'pending',
  })
  .select('*')
  .single()

const { data: completedOffer } = await supabase
  .from('offers')
  .insert({
    from_user_id: createdUsers[2].id,
    to_user_id: createdUsers[1].id,
    listing_id: keyboardListing.id,
    message: 'Offering the espresso setup for the keyboard kit.',
    credits_offered: 0,
    status: 'accepted',
  })
  .select('*')
  .single()

await supabase.from('offer_items').insert([
  {
    offer_id: pendingOffer.id,
    listing_id: keyboardListing.id,
    estimated_value: keyboardListing.estimated_value,
  },
  {
    offer_id: completedOffer.id,
    listing_id: coffeeListing.id,
    estimated_value: coffeeListing.estimated_value,
  },
])

const { data: trade } = await supabase
  .from('trades')
  .insert({
    offer_id: completedOffer.id,
    initiator_id: createdUsers[2].id,
    receiver_id: createdUsers[1].id,
    type: 'shipped',
    status: 'completed',
    completed_at: new Date().toISOString(),
  })
  .select('*')
  .single()

await supabase.from('shipments').insert([
  {
    trade_id: trade.id,
    direction: 'outbound',
    carrier: 'UPS',
    tracking_number: '1Z999AA10123456784',
    status: 'delivered',
    shipped_at: new Date().toISOString(),
    delivered_at: new Date().toISOString(),
  },
])

await supabase.from('reviews').insert([
  {
    trade_id: trade.id,
    reviewer_id: createdUsers[1].id,
    reviewee_id: createdUsers[2].id,
    rating: 5,
    reliability_score: 5,
    comment: 'Clear communication and careful packaging.',
  },
  {
    trade_id: trade.id,
    reviewer_id: createdUsers[2].id,
    reviewee_id: createdUsers[1].id,
    rating: 5,
    reliability_score: 4,
    comment: 'Smooth trade and fast confirmation.',
  },
])

await supabase.from('credit_ledger').insert([
  {
    user_id: createdUsers[0].id,
    amount: 10000,
    type: 'adjustment',
    description: 'Demo seed starting balance.',
  },
  {
    user_id: createdUsers[1].id,
    amount: 7500,
    type: 'adjustment',
    description: 'Demo seed starting balance.',
  },
  {
    user_id: createdUsers[2].id,
    amount: 5000,
    type: 'adjustment',
    description: 'Demo seed starting balance.',
  },
])

await supabase.from('equity_ledger').insert([
  {
    user_id: createdUsers[2].id,
    amount: 4000,
    description: 'Demo seed completed trade equity.',
    trade_id: trade.id,
  },
  {
    user_id: createdUsers[1].id,
    amount: -4000,
    description: 'Demo seed counterparty equity.',
    trade_id: trade.id,
  },
])

console.log('Demo seed complete.')
console.log('Demo users:')

for (const user of demoUsers) {
  console.log(`- ${user.email} / ${user.password}`)
}
