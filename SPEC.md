# BarterHound — Product Specification

## Overview

BarterHound is a local-first barter marketplace. Users list items they own, browse what others are offering, and propose trades — including bundled offers of multiple items plus optional platform credits. Trades can be completed via local meetup or shipped with tracking.

---

## Core Principles

1. **Barter first** — no cash changes hands; users trade goods for goods.
2. **Local first** — map-based browsing encourages nearby trades and meetups.
3. **Bundled offers** — users can combine multiple lower-value items to reach the value of a higher-value item.
4. **Trust by design** — reputation, reliability, and equity are tracked transparently.

---

## User Roles

| Role | Description |
|---|---|
| Guest | Browse public listings and profiles (read-only) |
| Authenticated User | Full access: list, offer, trade, review |

No admin role in MVP. Moderation tooling is post-MVP.

---

## Data Models

### `profiles`
- `id` — linked to `auth.users.id`
- `username` — unique handle
- `display_name`, `bio`, `avatar_url`
- `location_label`, `lat`, `lng` — used for map and distance filtering
- `trade_radius_km` — max distance user is willing to travel for meetups
- `is_verified` — reserved for future identity verification

### `listings`
- `title`, `description`, `category`, `condition`
- `estimated_value` — USD cents; used for offer equity calculation
- `trade_for` — free text describing what the user wants in return
- `is_local` / `is_shippable` — controls trade type eligibility
- `status`: `active | pending | traded | removed`

### `listing_images`
- Up to 8 images per listing
- Stored in Supabase Storage, `listing-images` bucket
- `position` controls display order

### `offers`
- Links `from_user` → `to_user` for a specific `listing_id` (the item being requested)
- `credits_offered` — optional platform credits added to sweeten the deal
- `status`: `pending | accepted | rejected | cancelled | expired`
- `expires_at` — offers auto-expire after 72 hours (configurable)

### `offer_items`
- The items the offering user puts on the table
- One or more `listing_id` entries linked to an offer
- `estimated_value` snapshot at time of offer

### `trades`
- Created when an offer is accepted
- `type`: `local_meetup | shipped`
- For meetup trades: `meetup_location`, `meetup_lat`, `meetup_lng`
- `status`: `agreed | in_progress | completed | disputed | cancelled`

### `shipments`
- Up to two per trade: `outbound` (initiator ships) and `inbound` (receiver ships)
- `carrier`, `tracking_number`, `status`
- Status: `label_created | shipped | in_transit | delivered | exception`

### `reviews`
- One review per side per trade (both parties review each other)
- `rating` 1–5 stars
- `reliability_score` 1–5 — separate dimension for responsiveness/follow-through

### `credit_ledger`
- Append-only double-entry style ledger
- `amount` positive = credit added, negative = credit spent
- `type`: `earn | spend | refund | adjustment`

### `equity_ledger`
- Tracks when a user gives up more market value than they receive
- `amount` = (value given) − (value received), in USD cents
- Used to build a "generosity" reputation signal over time

---

## Key User Flows

### 1. Sign Up
1. Enter email + password (or OAuth in later phase)
2. Confirm email
3. Create profile (username, location, avatar)

### 2. Create a Listing
1. Enter title, description, category, condition
2. Set estimated value
3. Describe what you'd trade for
4. Upload photos (max 8)
5. Choose local / shippable / both
6. Set location

### 3. Browse Listings
- Feed view: paginated grid, filterable by category, condition, location radius
- Map view: Mapbox markers, click for listing card sidebar

### 4. Make an Offer
1. Open a listing detail page
2. Click "Make Offer"
3. Offer builder: select one or more of your own active listings
4. Optionally add credits
5. Write a message
6. Submit offer (status = `pending`)

### 5. Accept / Reject an Offer
1. Receiver views offer in trade inbox
2. Can see items being offered and their values
3. Accept → creates a `trade`, sets listing status to `pending`
4. Reject or let expire → no trade created

### 6. Complete a Trade (Local Meetup)
1. Both parties agree on meetup time/place (out-of-band initially)
2. Either party marks trade as complete in app
3. Both prompted to leave a review

### 7. Complete a Trade (Shipped)
1. Initiator enters carrier + tracking number → shipment `outbound`
2. Receiver enters carrier + tracking number if shipping something back → shipment `inbound`
3. Both parties confirm delivery → trade `completed`

### 8. Leave a Review
- After trade completion, both parties review each other
- Rating + reliability score + optional comment
- Displayed on public profile

---

## Business Rules

| Rule | Detail |
|---|---|
| Offer expiry | 72 hours by default; configurable per offer |
| Listing lock | When an offer is accepted, listing status becomes `pending` |
| Listing unlock | If trade is cancelled/disputed, listing returns to `active` |
| Equity calculation | `equity = sum(offer_items.estimated_value) − listing.estimated_value`. If positive, the offering user gains equity. |
| Credit balance | Sum of all `credit_ledger.amount` entries for a user |
| Reliability score | Average `reliability_score` across all received reviews |
| Completion rate | `completed_trades / (completed + cancelled + disputed) * 100` |

---

## Screens

| Screen | Route | Phase |
|---|---|---|
| Landing | `/` | 1 (placeholder) |
| Sign In | `/login` | 3 |
| Sign Up | `/signup` | 3 |
| Dashboard | `/dashboard` | 3 |
| Browse Listings | `/listings` | 5 |
| Create Listing | `/listings/new` | 4 |
| Listing Detail | `/listings/[id]` | 4 |
| Edit Listing | `/listings/[id]/edit` | 4 |
| Map View | `/map` | 5 |
| Offers Inbox | `/offers` | 6 |
| Offer Builder | `/offers/new` | 6 |
| Shipment Tracking | `/trades/[id]/shipment` | 9 |
| User Profile | `/profile/[id]` | 3 |

---

## Design Guidelines

- **Primary color**: Orange (`#F97316`, Tailwind `orange-500`)
- **Tone**: Clean, approachable, community-focused; similar feel to OfferUp or Facebook Marketplace
- **Mobile-first**: All pages responsive, primary breakpoints `sm` and `md`
- **Images**: Lazy-loaded, with aspect-ratio containers to prevent layout shift
- **Accessibility**: Semantic HTML, ARIA labels on interactive elements, keyboard navigable

---

## Security & Privacy

- All database access is through Supabase RLS policies
- Auth tokens managed via Supabase SSR cookie helpers
- Location data is stored at listing-level precision (city/zip), not exact address unless user explicitly shares for meetup
- Images stored in private Supabase Storage bucket with signed URLs (Phase 4)
