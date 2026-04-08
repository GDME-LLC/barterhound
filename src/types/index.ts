// ---------------------------------------------------------------------------
// Core domain types for BarterHound
// All types mirror the Supabase schema defined in supabase/schema.sql
// ---------------------------------------------------------------------------

export type ListingStatus = 'active' | 'pending' | 'traded' | 'removed'
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired'
export type TradeStatus = 'agreed' | 'in_progress' | 'completed' | 'disputed' | 'cancelled'
export type TradeType = 'local_meetup' | 'shipped'
export type ShipmentDirection = 'outbound' | 'inbound'
export type ShipmentStatus = 'label_created' | 'shipped' | 'in_transit' | 'delivered' | 'exception'
export type CreditLedgerType = 'earn' | 'spend' | 'refund' | 'adjustment'

// ---------------------------------------------------------------------------
// Users & Profiles
// ---------------------------------------------------------------------------

export interface Profile {
  id: string // same as auth.users.id
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location_label: string | null
  lat: number | null
  lng: number | null
  trade_radius_km: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string
  condition: ListingCondition
  estimated_value: number | null // in USD cents
  trade_for: string | null // free-text preferences
  is_local: boolean
  is_shippable: boolean
  lat: number | null
  lng: number | null
  location_label: string | null
  brand: string | null
  model: string | null
  quantity: number | null
  is_bundle: boolean
  desired_categories: string[] | null
  open_to_anything: boolean
  ai_normalized_title: string | null
  ai_detected_brand: string | null
  ai_detected_model: string | null
  ai_estimated_low: number | null // in USD cents
  ai_estimated_high: number | null // in USD cents
  ai_confidence: 'low' | 'medium' | 'high' | null
  ai_explanation: string | null
  ai_valuation_fingerprint: string | null
  user_selected_trade_value: number | null // in USD cents
  is_verified_listing: boolean
  status: ListingStatus
  created_at: string
  updated_at: string
  // joined
  images?: ListingImage[]
  profile?: Profile
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  position: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export interface Offer {
  id: string
  from_user_id: string
  to_user_id: string
  listing_id: string // the listing being requested
  message: string | null
  status: OfferStatus
  credits_offered: number // in USD cents
  expires_at: string | null
  created_at: string
  updated_at: string
  // joined
  items?: OfferItem[]
  from_profile?: Profile
  to_profile?: Profile
  listing?: Listing
}

export interface OfferItem {
  id: string
  offer_id: string
  listing_id: string
  estimated_value: number // in USD cents at time of offer
  // joined
  listing?: Listing
}

// ---------------------------------------------------------------------------
// Trades
// ---------------------------------------------------------------------------

export interface Trade {
  id: string
  offer_id: string
  initiator_id: string
  receiver_id: string
  type: TradeType
  status: TradeStatus
  meetup_location: string | null
  meetup_lat: number | null
  meetup_lng: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // joined
  offer?: Offer
  shipments?: Shipment[]
}

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------

export interface Shipment {
  id: string
  trade_id: string
  direction: ShipmentDirection
  carrier: string | null
  tracking_number: string | null
  status: ShipmentStatus
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface Review {
  id: string
  trade_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number // 1–5
  comment: string | null
  reliability_score: number | null // 1–5
  created_at: string
  // joined
  reviewer?: Profile
}

// ---------------------------------------------------------------------------
// Credits & Equity
// ---------------------------------------------------------------------------

export interface CreditLedgerEntry {
  id: string
  user_id: string
  amount: number // positive = credit added, negative = credit spent
  type: CreditLedgerType
  description: string
  ref_id: string | null // offer_id or trade_id
  created_at: string
}

export interface EquityLedgerEntry {
  id: string
  user_id: string
  amount: number // positive = equity earned (gave up more value)
  description: string
  trade_id: string
  created_at: string
}
