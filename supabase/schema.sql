-- =============================================================================
-- BarterHound — Initial Database Schema
-- Supabase / PostgreSQL
-- Run this in your Supabase project: SQL Editor → New Query → Run
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";   -- for geo queries in Phase 5

-- =============================================================================
-- PROFILES
-- Extends Supabase auth.users (one row per authenticated user)
-- =============================================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  display_name    text,
  bio             text,
  avatar_url      text,
  location_label  text,
  lat             double precision,
  lng             double precision,
  trade_radius_km integer not null default 50,
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- LISTINGS
-- =============================================================================

create type listing_status    as enum ('active', 'pending', 'traded', 'removed');
create type listing_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');

create table if not exists public.listings (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text not null,
  category        text not null,
  condition       listing_condition not null,
  estimated_value integer not null,        -- USD cents
  trade_for       text,                    -- free-text trade preference
  is_local        boolean not null default true,
  is_shippable    boolean not null default false,
  lat             double precision,
  lng             double precision,
  location_label  text,
  status          listing_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index listings_user_id_idx  on public.listings(user_id);
create index listings_status_idx   on public.listings(status);
create index listings_category_idx on public.listings(category);

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- LISTING IMAGES
-- =============================================================================

create table if not exists public.listing_images (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  url         text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index listing_images_listing_id_idx on public.listing_images(listing_id);

-- =============================================================================
-- OFFERS
-- =============================================================================

create type offer_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'expired');

create table if not exists public.offers (
  id              uuid primary key default uuid_generate_v4(),
  from_user_id    uuid not null references public.profiles(id) on delete cascade,
  to_user_id      uuid not null references public.profiles(id) on delete cascade,
  listing_id      uuid not null references public.listings(id) on delete cascade,  -- listing being requested
  message         text,
  status          offer_status not null default 'pending',
  credits_offered integer not null default 0,  -- USD cents
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index offers_from_user_idx on public.offers(from_user_id);
create index offers_to_user_idx   on public.offers(to_user_id);
create index offers_status_idx    on public.offers(status);

create trigger offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

-- =============================================================================
-- OFFER ITEMS
-- Items the offering user is putting up as part of their offer
-- =============================================================================

create table if not exists public.offer_items (
  id               uuid primary key default uuid_generate_v4(),
  offer_id         uuid not null references public.offers(id) on delete cascade,
  listing_id       uuid not null references public.listings(id) on delete cascade,
  estimated_value  integer not null  -- USD cents at time of offer
);

create index offer_items_offer_id_idx on public.offer_items(offer_id);

-- =============================================================================
-- TRADES
-- Created when an offer is accepted
-- =============================================================================

create type trade_status as enum ('agreed', 'in_progress', 'completed', 'disputed', 'cancelled');
create type trade_type   as enum ('local_meetup', 'shipped');

create table if not exists public.trades (
  id               uuid primary key default uuid_generate_v4(),
  offer_id         uuid not null unique references public.offers(id),
  initiator_id     uuid not null references public.profiles(id),
  receiver_id      uuid not null references public.profiles(id),
  type             trade_type not null,
  status           trade_status not null default 'agreed',
  meetup_location  text,
  meetup_lat       double precision,
  meetup_lng       double precision,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index trades_initiator_idx on public.trades(initiator_id);
create index trades_receiver_idx  on public.trades(receiver_id);
create index trades_status_idx    on public.trades(status);

create trigger trades_updated_at
  before update on public.trades
  for each row execute function public.set_updated_at();

-- =============================================================================
-- SHIPMENTS
-- One per direction (outbound from initiator, inbound to receiver)
-- =============================================================================

create type shipment_direction as enum ('outbound', 'inbound');
create type shipment_status    as enum ('label_created', 'shipped', 'in_transit', 'delivered', 'exception');

create table if not exists public.shipments (
  id               uuid primary key default uuid_generate_v4(),
  trade_id         uuid not null references public.trades(id) on delete cascade,
  direction        shipment_direction not null,
  carrier          text,
  tracking_number  text,
  status           shipment_status not null default 'label_created',
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index shipments_trade_id_idx on public.shipments(trade_id);

create trigger shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

-- =============================================================================
-- REVIEWS
-- Left after a trade is completed
-- =============================================================================

create table if not exists public.reviews (
  id                uuid primary key default uuid_generate_v4(),
  trade_id          uuid not null references public.trades(id) on delete cascade,
  reviewer_id       uuid not null references public.profiles(id),
  reviewee_id       uuid not null references public.profiles(id),
  rating            smallint not null check (rating between 1 and 5),
  comment           text,
  reliability_score smallint check (reliability_score between 1 and 5),
  created_at        timestamptz not null default now(),
  unique (trade_id, reviewer_id)   -- one review per side per trade
);

create index reviews_reviewee_idx on public.reviews(reviewee_id);

-- =============================================================================
-- CREDIT LEDGER
-- Double-entry style credit accounting
-- =============================================================================

create type credit_ledger_type as enum ('earn', 'spend', 'refund', 'adjustment');

create table if not exists public.credit_ledger (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,              -- positive = credit, negative = debit
  type        credit_ledger_type not null,
  description text not null,
  ref_id      uuid,                          -- offer_id or trade_id
  created_at  timestamptz not null default now()
);

create index credit_ledger_user_id_idx on public.credit_ledger(user_id);

-- =============================================================================
-- EQUITY LEDGER
-- Equity earned when a user gives more value than they receive in a trade
-- =============================================================================

create table if not exists public.equity_ledger (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null,              -- USD cents; positive = equity earned
  description text not null,
  trade_id    uuid not null references public.trades(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index equity_ledger_user_id_idx on public.equity_ledger(user_id);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- Policies are intentionally permissive placeholders.
-- Harden in Phase 3 alongside auth implementation.
-- =============================================================================

alter table public.profiles      enable row level security;
alter table public.listings      enable row level security;
alter table public.listing_images enable row level security;
alter table public.offers        enable row level security;
alter table public.offer_items   enable row level security;
alter table public.trades        enable row level security;
alter table public.shipments     enable row level security;
alter table public.reviews       enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.equity_ledger enable row level security;

-- Public read on profiles and active listings
create policy "Public profiles are viewable"
  on public.profiles for select using (true);

create policy "Active listings are viewable"
  on public.listings for select using (status = 'active');

create policy "Listing images are viewable"
  on public.listing_images for select using (true);

create policy "Reviews are viewable"
  on public.reviews for select using (true);

-- Owners can manage their own rows
create policy "Users manage own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users manage own listings"
  on public.listings for all using (auth.uid() = user_id);

create policy "Users manage own listing images"
  on public.listing_images for all
  using (
    listing_id in (
      select id from public.listings where user_id = auth.uid()
    )
  );

create policy "Offer participants can view offers"
  on public.offers for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Offer sender can create offer"
  on public.offers for insert with check (auth.uid() = from_user_id);

create policy "Offer receiver can update status"
  on public.offers for update using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy "Trade participants can view trades"
  on public.trades for select
  using (auth.uid() = initiator_id or auth.uid() = receiver_id);

create policy "Trade participants can update trades"
  on public.trades for update
  using (auth.uid() = initiator_id or auth.uid() = receiver_id);

create policy "Trade participants can view shipments"
  on public.shipments for select
  using (
    trade_id in (
      select id from public.trades
      where initiator_id = auth.uid() or receiver_id = auth.uid()
    )
  );

create policy "Trade participants can manage shipments"
  on public.shipments for all
  using (
    trade_id in (
      select id from public.trades
      where initiator_id = auth.uid() or receiver_id = auth.uid()
    )
  );

create policy "Users view own credits"
  on public.credit_ledger for select using (auth.uid() = user_id);

create policy "Users view own equity"
  on public.equity_ledger for select using (auth.uid() = user_id);
