# BarterHound

A local-first barter marketplace MVP scaffold.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth / Storage | Supabase (planned integration) |
| Map | Mapbox GL JS (Phase 5) |

---

## Phase 1 Scope

This repo is intentionally limited to an MVP scaffold:

- Core docs and phased roadmap are in place
- Main app routes exist as placeholder pages
- Supabase helper files and schema are included as planning/setup assets
- Full business logic, polished UI, and advanced backend workflows are deferred to later phases

---

## Project Structure

```text
barterhound/
|-- supabase/
|   `-- schema.sql
|-- src/
|   |-- app/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- (auth)/
|   |   |   |-- login/page.tsx
|   |   |   `-- signup/page.tsx
|   |   |-- dashboard/page.tsx
|   |   |-- listings/
|   |   |   |-- page.tsx
|   |   |   |-- new/page.tsx
|   |   |   `-- [id]/
|   |   |       |-- page.tsx
|   |   |       `-- edit/page.tsx
|   |   |-- map/page.tsx
|   |   |-- offers/
|   |   |   |-- page.tsx
|   |   |   `-- new/page.tsx
|   |   |-- trades/
|   |   |   `-- [id]/shipment/page.tsx
|   |   `-- profile/[id]/page.tsx
|   |-- components/
|   |-- lib/
|   |   `-- supabase/
|   |       |-- client.ts
|   |       `-- server.ts
|   `-- types/
|       `-- index.ts
|-- SPEC.md
|-- TASKS.md
|-- .env.example
`-- README.md
```

---

## Planning Assets

See [`supabase/schema.sql`](./supabase/schema.sql) for the draft schema and [`src/types/index.ts`](./src/types/index.ts) for matching domain types.

These are included so later phases have a stable target model, but they are not fully wired into the app yet.

Planned core tables:

| Table | Purpose |
|---|---|
| `profiles` | Public user data (extends `auth.users`) |
| `listings` | Items listed for trade |
| `listing_images` | Images attached to a listing |
| `offers` | A trade proposal from one user to another |
| `offer_items` | Individual items bundled in an offer |
| `trades` | An accepted offer converted to a trade |
| `shipments` | Shipping and tracking per trade direction |
| `reviews` | Post-trade ratings and comments |
| `credit_ledger` | Planned platform credit accounting |
| `equity_ledger` | Planned equity tracking for value-asymmetric trades |

---

## Local Development Setup

### 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [Mapbox](https://mapbox.com) account for Phase 5

### 2. Clone and install

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

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token
```

### 4. Optional Phase 2 setup

If you want to start the backend setup in Phase 2:

1. Open the Supabase dashboard for your project.
2. Go to **SQL Editor** -> **New Query**.
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

- App Router only; no `pages/` directory
- Server Components by default
- Supabase files are scaffold-level helpers; integration work begins in later phases
- Schema and RLS are planning artifacts for now, not completed backend implementation
- Equity and credits are planned concepts; no ledger business logic is implemented yet

---

## Phased Roadmap

See [`TASKS.md`](./TASKS.md) for the full breakdown.

| Phase | Description |
|---|---|
| 1 | Completed: project scaffold, docs, route placeholders, planning assets |
| 2 | Supabase project setup, storage buckets, RLS hardening |
| 3 | Auth (sign up / sign in / sign out), profile creation |
| 4 | Listings CRUD + image upload |
| 5 | Browse feed + Mapbox map view |
| 6 | Offer builder + trade inbox |
| 7 | Trade completion, reviews, reliability scoring |
| 8 | Credits and equity ledger |
| 9 | Shipment tracking workflow |
| 10 | Seed data, UX polish, production deployment |
