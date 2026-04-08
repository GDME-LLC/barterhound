# BarterHound

BarterHound is a local-first barter marketplace MVP built with Next.js 15 and Supabase.

The app now supports:

- email/password auth plus Google OAuth
- profile onboarding and public profiles
- listing create/edit/remove flows with image uploads
- browse feed and Mapbox-based map browsing
- offer creation with threaded counters and optional credits
- trade status changes, shipment tracking, reviews, and reliability metrics
- explicit credit and equity ledger writes
- demo seeding for local environments with a configured Supabase project

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- Mapbox GL JS

## Project Structure

```text
barterhound/
|-- scripts/
|   `-- seed-demo.mjs
|-- supabase/
|   |-- migrations/
|   |   |-- 20260406193000_init_mvp.sql
|   |   `-- 20260408120000_listings_ai_fields.sql
|   `-- schema.sql
|-- src/
|   |-- app/
|   |-- components/
|   |-- lib/
|   `-- types/
|-- .env.example
|-- README.md
|-- SPEC.md
`-- TASKS.md
```

## Environment

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
```

Supabase setup required for the full app:

1. Apply `supabase/migrations/20260406193000_init_mvp.sql`.
2. Apply `supabase/migrations/20260408120000_listings_ai_fields.sql`.
3. Create public buckets named `listing-images` and `avatars`.
4. Add `http://localhost:3000/auth/callback` to Supabase redirect URLs.
5. Enable Google OAuth in Supabase if you want social sign-in.

## Local Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run lint
npm run build
npm run seed:demo
```

`npm run seed:demo` requires a working `.env.local` with service-role access. It creates demo auth users, profiles, listings, offers, a completed shipped trade, reviews, and ledger entries.

Demo user passwords created by the seed script:

- `alice.demo@barterhound.local` / `BarterHound123!`
- `marco.demo@barterhound.local` / `BarterHound123!`
- `riley.demo@barterhound.local` / `BarterHound123!`

## MVP Behavior Notes

- Listing locations are approximate city-level coordinates for browsing and map display.
- Credits and equity are separate append-only ledgers.
- Credit balance is checked when an offer is created, debited on acceptance, and refunded on cancelled/disputed trades.
- Equity is written only when a trade completes. The current first-pass rule compares the accepted listing value against the offered listings plus credits and mirrors the resulting delta across both participants.
- Shipment tracking is manual for MVP; there is no carrier API integration yet.

## Verification

The repo is set up to verify with:

```bash
npm run typecheck
npm run lint
npm run build
```

## Remaining MVP Constraints

- Running the full product still depends on a configured Supabase project and storage buckets.
- Map browsing requires `NEXT_PUBLIC_MAPBOX_TOKEN`.
- The current demo seed script targets hosted/local Supabase projects with admin credentials; it is not intended for production data.
