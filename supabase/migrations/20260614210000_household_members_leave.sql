-- Listar miembros del hogar (evita fallos del embed profiles en PostgREST)
create or replace function public.get_household_members_list(p_household_id uuid)
returns table (
  id uuid,
  user_id uuid,
  role public.member_role,
  joined_at timestamptz,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    hm.id,
    hm.user_id,
    hm.role,
    hm.joined_at,
    p.full_name,
    p.avatar_url
  from public.household_members hm
  left join public.profiles p on p.id = hm.user_id
  where hm.household_id = p_household_id
    and private.is_household_member(p_household_id)
  order by hm.joined_at asc;
$$;

-- Salir del hogar (el owner transfiere rol al miembro más antiguo)
create or replace function public.leave_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role public.member_role;
  v_member_count int;
  v_next_owner uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select role into v_role
  from public.household_members
  where household_id = p_household_id and user_id = v_user_id;

  if v_role is null then
    raise exception 'Not a member of this household';
  end if;

  select count(*)::int into v_member_count
  from public.household_members
  where household_id = p_household_id;

  if v_role = 'owner' and v_member_count > 1 then
    select hm.user_id into v_next_owner
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id != v_user_id
    order by hm.joined_at asc
    limit 1;

    update public.household_members
    set role = 'owner'
    where household_id = p_household_id and user_id = v_next_owner;
  end if;

  delete from public.household_members
  where household_id = p_household_id and user_id = v_user_id;

  if v_member_count = 1 then
    delete from public.households where id = p_household_id;
  end if;
end;
$$;

-- El owner puede quitar a otro miembro
create or replace function public.remove_household_member(
  p_household_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_household_owner(p_household_id) then
    raise exception 'Only the owner can remove members';
  end if;

  if p_user_id = v_caller then
    raise exception 'Use leave_household to remove yourself';
  end if;

  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = p_user_id
  ) then
    raise exception 'User is not a member';
  end if;

  delete from public.household_members
  where household_id = p_household_id and user_id = p_user_id;
end;
$$;

grant execute on function public.get_household_members_list(uuid) to authenticated;
grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
