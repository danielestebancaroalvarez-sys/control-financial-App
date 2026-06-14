-- Allow household members to see each other's profiles (for member list in /ajustes)

create policy "profiles_select_household_peers"
  on public.profiles for select to authenticated
  using (
    id in (
      select hm2.user_id
      from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = (select auth.uid())
    )
  );
