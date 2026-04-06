# BarterHound — Development Tasks

## Phase 1 — Project Scaffold ✅
- [x] Initialize Next.js 14 project (App Router, TypeScript, Tailwind CSS)
- [x] Create folder structure (`src/app`, `src/components`, `src/lib`, `src/types`)
- [x] Add `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`
- [x] Add `.gitignore` and `.env.example`
- [x] Scaffold all app routes with placeholder pages
- [x] Add shared TypeScript types (`src/types/index.ts`)
- [x] Add Supabase client stubs (`src/lib/supabase/client.ts`, `server.ts`)
- [x] Write `supabase/schema.sql` — full database schema with RLS policies
- [x] Write `README.md` with setup instructions and architecture overview
- [x] Write `SPEC.md` — full product specification
- [x] Write `TASKS.md` — this file

## Phase 2 — Supabase Project Setup
- [ ] Create Supabase project and apply `schema.sql`
- [ ] Create Storage buckets: `listing-images`, `avatars`
- [ ] Configure Storage bucket policies (public read for images)
- [ ] Harden RLS policies for all tables
- [ ] Add Supabase environment variables to `.env.local`
- [ ] Test RLS policies with Supabase dashboard table editor

## Phase 3 — Authentication & Profiles
- [ ] Implement sign-up page (`/signup`) with email + password
- [ ] Implement login page (`/login`) with email + password
- [ ] Add auth callback route (`/auth/callback`) for email confirmation
- [ ] Add sign-out action
- [ ] Protect routes: redirect unauthenticated users from `/dashboard`, `/listings/new`, `/offers`
- [ ] Auto-create profile row on first sign-in (Supabase function or server action)
- [ ] Build profile creation/edit form (username, bio, avatar, location)
- [ ] Build public profile page (`/profile/[id]`) showing avatar, stats, reviews, listings
- [ ] Add Navbar with auth state (sign in / sign out / avatar)

## Phase 4 — Listings & Image Upload
- [ ] Build create listing form (`/listings/new`): title, description, category, condition, value, trade preferences
- [ ] Add image upload (Supabase Storage, max 8 images, drag-to-reorder)
- [ ] Build edit listing page (`/listings/[id]/edit`)
- [ ] Build listing detail page (`/listings/[id]`): images carousel, details, "Make Offer" CTA
- [ ] Add soft-delete / remove listing action
- [ ] Add listing status badge (active / pending / traded / removed)
- [ ] Validate estimated value as positive integer (USD)

## Phase 5 — Browse Feed & Map View
- [ ] Build browse listings page (`/listings`): paginated grid, ListingCard component
- [ ] Add filter bar: category, condition, local/shippable, estimated value range
- [ ] Add keyword search
- [ ] Build map page (`/map`) with Mapbox GL JS
- [ ] Add listing markers to map; click to open sidebar with ListingCard
- [ ] Add location-radius filter to feed view
- [ ] Add `NEXT_PUBLIC_MAPBOX_TOKEN` to environment setup docs

## Phase 6 — Offer Builder & Trade Inbox
- [ ] Build offer builder (`/offers/new?listing=<id>`): select your listings, add credits, write message
- [ ] Show value summary (their item vs. your offer) in offer builder
- [ ] Submit offer (server action → insert offer + offer_items)
- [ ] Build offers inbox (`/offers`): tabs for incoming / outgoing
- [ ] Build OfferCard component showing items on both sides
- [ ] Accept offer: create trade record, set listing status to `pending`
- [ ] Reject / cancel offer actions
- [ ] Offer expiry: mark expired offers via cron or on-read check

## Phase 7 — Trade Completion, Reviews & Reliability
- [ ] Build trade detail view (reachable from offers inbox)
- [ ] "Mark as Complete" action for local meetup trades
- [ ] Post-completion review prompt (rating + reliability score + comment)
- [ ] Store reviews; update profile page to show average rating and reliability
- [ ] Calculate and display completion rate on profile
- [ ] Unlock listing (back to `active`) when trade is cancelled or disputed

## Phase 8 — Credits & Equity Ledger
- [ ] Display credit balance on dashboard and profile
- [ ] Allow credits to be added to offers (deducted on acceptance)
- [ ] Calculate equity delta on trade completion and write to `equity_ledger`
- [ ] Display lifetime equity on profile
- [ ] Refund credits if trade is cancelled before completion

## Phase 9 — Shipment Tracking
- [ ] Build shipment tracking page (`/trades/[id]/shipment`)
- [ ] Form to enter carrier + tracking number for outbound shipment
- [ ] Form to enter carrier + tracking number for inbound shipment (if applicable)
- [ ] Display shipment status timeline
- [ ] "Confirm Delivery" button to advance trade status
- [ ] Optional: webhook or polling to auto-update tracking status via carrier API

## Phase 10 — Seed Data, UX Polish & Deployment
- [ ] Create seed script with realistic sample profiles, listings, offers, and trades
- [ ] Add loading skeletons for listings grid and map
- [ ] Add empty-state illustrations for inbox, browse feed
- [ ] Add toast notifications for actions (offer sent, accepted, etc.)
- [ ] Add meta tags / Open Graph for listing detail pages
- [ ] Configure Vercel deployment (environment variables, preview deployments)
- [ ] Write deployment section in README
- [ ] Final accessibility audit (keyboard nav, ARIA, color contrast)
