-- =============================================================================
-- BarterHound - Ensure required Storage buckets exist
-- =============================================================================
-- Buckets:
-- - avatars
-- - listing-images

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

