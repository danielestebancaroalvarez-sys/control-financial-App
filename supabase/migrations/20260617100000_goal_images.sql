-- Goal cover images (path: {household_id}/{goal_id}.jpg)
alter table public.productivity_goals
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'goal-images',
  'goal-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "goal_images_select_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'goal-images');

create policy "goal_images_insert_member"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'goal-images'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );

create policy "goal_images_update_member"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'goal-images'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );

create policy "goal_images_delete_member"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'goal-images'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );
