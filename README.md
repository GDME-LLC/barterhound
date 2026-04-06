# BarterHound

A **local-first barter marketplace** where users list items they're willing to trade, build bundled offers (multiple items + optional credits), and complete trades locally or via shipping.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth / Storage | Supabase |
| Map | Mapbox GL JS *(Phase 5)* |

---

## Project Structure

```
barterhound/
├── supabase/
│   └── schema.sql          # Full Postgres schema — run in Supabase SQL editor
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── listings/
│   │   │   ├── page.tsx                  # Browse feed
│   │   │   ├── new/page.tsx              # Create listing
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Listing detail
│   │   │       └── edit/page.tsx
│   │   ├── map/page.tsx                  # Map browse (Mapbox)
│   │   ├── offers/
│   │   │   ├── page.tsx                  # Trade inbox
│   │   │   └── new/page.tsx              # Offer builder
│   │   ├── trades/
│   │   │   └── [id]/shipment/page.tsx    # Shipment tracking
│   │   └── profile/[id]/page.tsx
│   ├── components/         # Reusable UI components (Phase 3+)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts   # Browser-side Supabase client
│   │       └── server.ts   # Server-side Supabase client
│   └── types/
│       └── index.ts        # Shared TypeScript domain types
├── SPEC.md                 # Full product specification
├── TASKS.md                # Phased development task list
├── .env.example            # Required environment variables
└── README.md               # This file
```

---

## Database Schema

See [`supabase/schema.sql`](./supabase/schema.sql) for the full schema.

Core tables:

| Table | Purpose |
|---|---|
| `profiles` | Public user data (extends `auth.users`) |
| `listings` | Items listed for trade |
| `listing_images` | Images attached to a listing |
| `offers` | A trade proposal from one user to another |
| `offer_items` | Individual items bundled in an offer |
| `trades` | An accepted offer converted to a trade |
| `shipments` | Shipping/tracking per trade direction |
| `reviews` | Post-trade ratings and comments |
| `credit_ledger` | Platform credit accounting |
| `equity_ledger` | Equity earned from value-asymmetric trades |

---

## Local Development Setup

### 1. Prerequisites

- Node.js ≥ 18
- A free [Supabase](https://supabase.com) project
- A free [Mapbox](https://mapbox.com) account *(for Phase 5)*

### 2. Clone & install

```bash
git clone https://github.com/GDME-LLC/barterhound.git
cd barterhound
npm install
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token
```

### 4. Run the database schema

1. Open the Supabase dashboard for your project.
2. Go to **SQL Editor** → **New Query**.
3. Paste the contents of `supabase/schema.sql` and click **Run**.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Architecture Notes

- **App Router only** — no `pages/` directory.
- **Server Components by default** — client components opt in via `'use client'`.
- **Supabase SSR** — uses `@supabase/ssr` for cookie-based auth in both Server and Client Components.
- **RLS enforced** — Row-Level Security policies are defined in `schema.sql`. All business authorization lives in the database, not just in API routes.
- **Equity ≠ Credits** — Credits are a platform currency; equity is a separate ledger that tracks when a user gave up more market value than they received, providing a reputation signal over time.

---

## Phased Roadmap

See [`TASKS.md`](./TASKS.md) for the full breakdown.

| Phase | Description |
|---|---|
| 1 | ✅ Project scaffold, schema, docs |
| 2 | Supabase project setup, storage buckets, RLS hardening |
| 3 | Auth (sign up / sign in / sign out), profile creation |
| 4 | Listings CRUD + image upload |
| 5 | Browse feed + Mapbox map view |
| 6 | Offer builder + trade inbox |
| 7 | Trade completion, reviews, reliability scoring |
| 8 | Credits & equity ledger |
| 9 | Shipment tracking workflow |
| 10 | Seed data, UX polish, production deployment |
