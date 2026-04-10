-- =============================================================================
-- BarterHound - Storage policies for client-side uploads
-- =============================================================================
-- This enables authenticated users to upload their own listing images and avatars
-- directly from the browser (avoids Server Action body limits on hosting).

-- Public read for listing images and avatars (buckets are intended to be public).
drop policy if exists "Public read listing images" on storage.objects;
create policy "Public read listing images"
on storage.objects for select
using (bucket_id = 'listing-images');

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects for select
using (bucket_id = 'avatars');

-- Authenticated users can write only into their own folder: <auth.uid()>/<...>
drop policy if exists "Users upload own listing images" on storage.objects;
create policy "Users upload own listing images"
on storage.objects for insert
with check (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own listing images" on storage.objects;
create policy "Users update own listing images"
on storage.objects for update
using (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own listing images" on storage.objects;
create policy "Users delete own listing images"
on storage.objects for delete
using (
  bucket_id = 'listing-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users upload own avatars" on storage.objects;
create policy "Users upload own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own avatars" on storage.objects;
create policy "Users delete own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

