-- =============================================================================
-- BarterHound - Listings: trade-first optional fields + AI valuation metadata
-- =============================================================================

-- Make description optional (UI can submit without it).
alter table public.listings
  alter column description drop not null;

alter table public.listings
  drop constraint if exists listings_description_check;

alter table public.listings
  add constraint listings_description_check
  check (description is null or char_length(description) between 10 and 4000);

-- Make value optional. When present, stored in USD cents.
alter table public.listings
  alter column estimated_value drop not null;

alter table public.listings
  drop constraint if exists listings_estimated_value_check;

alter table public.listings
  add constraint listings_estimated_value_check
  check (estimated_value is null or estimated_value > 0);

-- User-entered detail fields (optional).
alter table public.listings
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists quantity integer,
  add column if not exists is_bundle boolean not null default false,
  add column if not exists desired_categories text[],
  add column if not exists open_to_anything boolean not null default false;

alter table public.listings
  drop constraint if exists listings_quantity_check;

alter table public.listings
  add constraint listings_quantity_check
  check (quantity is null or quantity between 1 and 99);

-- AI valuation fields (all optional; listing creation must work without them).
alter table public.listings
  add column if not exists ai_normalized_title text,
  add column if not exists ai_detected_brand text,
  add column if not exists ai_detected_model text,
  add column if not exists ai_estimated_low integer,
  add column if not exists ai_estimated_high integer,
  add column if not exists ai_confidence text,
  add column if not exists ai_explanation text,
  add column if not exists ai_valuation_fingerprint text,
  add column if not exists user_selected_trade_value integer,
  add column if not exists is_verified_listing boolean not null default false;

alter table public.listings
  drop constraint if exists listings_ai_confidence_check;

alter table public.listings
  add constraint listings_ai_confidence_check
  check (ai_confidence is null or ai_confidence in ('low', 'medium', 'high'));

alter table public.listings
  drop constraint if exists listings_ai_range_check;

alter table public.listings
  add constraint listings_ai_range_check
  check (
    ai_estimated_low is null
    or ai_estimated_high is null
    or (ai_estimated_low > 0 and ai_estimated_high > 0 and ai_estimated_low <= ai_estimated_high)
  );

alter table public.listings
  drop constraint if exists listings_user_selected_trade_value_check;

alter table public.listings
  add constraint listings_user_selected_trade_value_check
  check (user_selected_trade_value is null or user_selected_trade_value > 0);

