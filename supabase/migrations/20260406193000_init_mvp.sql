-- =============================================================================
-- BarterHound - Full MVP schema reference
-- Source of truth for application semantics; keep in sync with migrations.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type listing_status as enum ('active', 'pending', 'traded', 'removed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_condition') then
    create type listing_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type offer_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'expired');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trade_status') then
    create type trade_status as enum ('agreed', 'in_progress', 'completed', 'disputed', 'cancelled');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trade_type') then
    create type trade_type as enum ('local_meetup', 'shipped');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'shipment_direction') then
    create type shipment_direction as enum ('outbound', 'inbound');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'shipment_status') then
    create type shipment_status as enum ('label_created', 'shipped', 'in_transit', 'delivered', 'exception');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'credit_ledger_type') then
    create type credit_ledger_type as enum ('earn', 'spend', 'refund', 'adjustment');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  display_name text,
  bio text,
  avatar_url text,
  location_label text,
  lat double precision,
  lng double precision,
  trade_radius_km integer not null default 50 check (trade_radius_km between 1 and 500),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  category text not null check (char_length(category) between 2 and 40),
  condition listing_condition not null,
  estimated_value integer not null check (estimated_value > 0),
  trade_for text,
  is_local boolean not null default true,
  is_shippable boolean not null default false,
  lat double precision,
  lng double precision,
  location_label text,
  status listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_local or is_shippable)
);

create table if not exists public.listing_images (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  url text not null,
  position integer not null default 0 check (position between 0 and 7),
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(),
  root_offer_id uuid references public.offers(id) on delete set null,
  parent_offer_id uuid references public.offers(id) on delete set null,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  message text,
  credits_offered integer not null default 0 check (credits_offered >= 0),
  status offer_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '72 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user_id <> to_user_id),
  check (root_offer_id is null or root_offer_id <> id),
  check (parent_offer_id is null or parent_offer_id <> id)
);

create table if not exists public.offer_items (
  id uuid primary key default uuid_generate_v4(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  estimated_value integer not null check (estimated_value > 0),
  created_at timestamptz not null default now(),
  unique (offer_id, listing_id)
);

create table if not exists public.trades (
  id uuid primary key default uuid_generate_v4(),
  offer_id uuid not null unique references public.offers(id) on delete restrict,
  initiator_id uuid not null references public.profiles(id) on delete restrict,
  receiver_id uuid not null references public.profiles(id) on delete restrict,
  type trade_type not null,
  status trade_status not null default 'agreed',
  meetup_location text,
  meetup_lat double precision,
  meetup_lng double precision,
  completed_at timestamptz,
  cancelled_at timestamptz,
  disputed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (initiator_id <> receiver_id)
);

create table if not exists public.shipments (
  id uuid primary key default uuid_generate_v4(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  direction shipment_direction not null,
  carrier text,
  tracking_number text,
  status shipment_status not null default 'label_created',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trade_id, direction)
);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  reliability_score smallint not null check (reliability_score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (trade_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

create table if not exists public.credit_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  type credit_ledger_type not null,
  description text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.equity_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  description text not null,
  trade_id uuid not null references public.trades(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trade_id, user_id)
);

create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_created_at_idx on public.listings(created_at desc);
create index if not exists listing_images_listing_id_idx on public.listing_images(listing_id);
create index if not exists offers_root_offer_idx on public.offers(coalesce(root_offer_id, id));
create index if not exists offers_listing_id_idx on public.offers(listing_id);
create index if not exists offers_from_user_idx on public.offers(from_user_id);
create index if not exists offers_to_user_idx on public.offers(to_user_id);
create index if not exists offers_status_idx on public.offers(status);
create index if not exists offer_items_offer_id_idx on public.offer_items(offer_id);
create index if not exists trades_initiator_idx on public.trades(initiator_id);
create index if not exists trades_receiver_idx on public.trades(receiver_id);
create index if not exists trades_status_idx on public.trades(status);
create index if not exists shipments_trade_id_idx on public.shipments(trade_id);
create index if not exists reviews_reviewee_idx on public.reviews(reviewee_id);
create index if not exists credit_ledger_user_id_idx on public.credit_ledger(user_id, created_at desc);
create index if not exists equity_ledger_user_id_idx on public.equity_ledger(user_id, created_at desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at before update on public.offers
for each row execute function public.set_updated_at();

drop trigger if exists trades_updated_at on public.trades;
create trigger trades_updated_at before update on public.trades
for each row execute function public.set_updated_at();

drop trigger if exists shipments_updated_at on public.shipments;
create trigger shipments_updated_at before update on public.shipments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.offers enable row level security;
alter table public.offer_items enable row level security;
alter table public.trades enable row level security;
alter table public.shipments enable row level security;
alter table public.reviews enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.equity_ledger enable row level security;

drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Public profiles are viewable"
on public.profiles for select using (true);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Active listings are viewable" on public.listings;
create policy "Active listings are viewable"
on public.listings for select using (status = 'active' or auth.uid() = user_id);

drop policy if exists "Users manage own listings" on public.listings;
create policy "Users manage own listings"
on public.listings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Listing images are viewable" on public.listing_images;
create policy "Listing images are viewable"
on public.listing_images for select using (true);

drop policy if exists "Users manage own listing images" on public.listing_images;
create policy "Users manage own listing images"
on public.listing_images for all
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id and listings.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id and listings.user_id = auth.uid()
  )
);

drop policy if exists "Offer participants can view offers" on public.offers;
create policy "Offer participants can view offers"
on public.offers for select
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "Offer sender can create offer" on public.offers;
create policy "Offer sender can create offer"
on public.offers for insert
with check (auth.uid() = from_user_id);

drop policy if exists "Offer participants can update offers" on public.offers;
create policy "Offer participants can update offers"
on public.offers for update
using (auth.uid() = from_user_id or auth.uid() = to_user_id)
with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "Offer participants can view offer items" on public.offer_items;
create policy "Offer participants can view offer items"
on public.offer_items for select
using (
  exists (
    select 1 from public.offers
    where offers.id = offer_items.offer_id
      and (offers.from_user_id = auth.uid() or offers.to_user_id = auth.uid())
  )
);

drop policy if exists "Offer sender can manage offer items" on public.offer_items;
create policy "Offer sender can manage offer items"
on public.offer_items for all
using (
  exists (
    select 1 from public.offers
    where offers.id = offer_items.offer_id and offers.from_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.offers
    where offers.id = offer_items.offer_id and offers.from_user_id = auth.uid()
  )
);

drop policy if exists "Trade participants can view trades" on public.trades;
create policy "Trade participants can view trades"
on public.trades for select
using (auth.uid() = initiator_id or auth.uid() = receiver_id);

drop policy if exists "Trade participants can update trades" on public.trades;
create policy "Trade participants can update trades"
on public.trades for update
using (auth.uid() = initiator_id or auth.uid() = receiver_id)
with check (auth.uid() = initiator_id or auth.uid() = receiver_id);

drop policy if exists "Trade participants can insert trades" on public.trades;
create policy "Trade participants can insert trades"
on public.trades for insert
with check (auth.uid() = initiator_id or auth.uid() = receiver_id);

drop policy if exists "Trade participants can view shipments" on public.shipments;
create policy "Trade participants can view shipments"
on public.shipments for select
using (
  exists (
    select 1 from public.trades
    where trades.id = shipments.trade_id
      and (trades.initiator_id = auth.uid() or trades.receiver_id = auth.uid())
  )
);

drop policy if exists "Trade participants can manage shipments" on public.shipments;
create policy "Trade participants can manage shipments"
on public.shipments for all
using (
  exists (
    select 1 from public.trades
    where trades.id = shipments.trade_id
      and (trades.initiator_id = auth.uid() or trades.receiver_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.trades
    where trades.id = shipments.trade_id
      and (trades.initiator_id = auth.uid() or trades.receiver_id = auth.uid())
  )
);

drop policy if exists "Reviews are viewable" on public.reviews;
create policy "Reviews are viewable"
on public.reviews for select using (true);

drop policy if exists "Trade participants can create reviews" on public.reviews;
create policy "Trade participants can create reviews"
on public.reviews for insert
with check (auth.uid() = reviewer_id);

drop policy if exists "Users view own credits" on public.credit_ledger;
create policy "Users view own credits"
on public.credit_ledger for select using (auth.uid() = user_id);

drop policy if exists "Users view own equity" on public.equity_ledger;
create policy "Users view own equity"
on public.equity_ledger for select using (auth.uid() = user_id);
