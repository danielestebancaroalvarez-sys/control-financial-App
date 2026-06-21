-- Allow household members to register transactions on behalf of a partner.

create or replace function private.is_household_peer(p_household_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = p_household_id
      and user_id = p_user_id
  );
$$;

grant execute on function private.is_household_peer(uuid, uuid) to authenticated, service_role;

drop policy if exists "transactions_insert_member" on public.transactions;

create policy "transactions_insert_member"
  on public.transactions for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and private.is_household_peer(household_id, created_by)
  );
