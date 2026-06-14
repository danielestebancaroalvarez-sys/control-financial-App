-- Receipt image path on transactions
alter table public.transactions
  add column if not exists receipt_image_path text;

-- Private bucket for receipt photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Household members can read receipts in their household folder
create policy "receipts_select_member"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );

-- Household members can upload receipts to their household folder
create policy "receipts_insert_member"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );

create policy "receipts_update_member"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );

create policy "receipts_delete_member"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] in (
      select hm.household_id::text
      from public.household_members hm
      where hm.user_id = (select auth.uid())
    )
  );
