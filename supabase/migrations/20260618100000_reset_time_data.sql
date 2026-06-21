-- Reset all time-module data for a household (keeps hogar, miembros y categorías del sistema)

create or replace function public.reset_time_data(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_household_member(p_household_id) then
    raise exception 'No autorizado';
  end if;

  delete from public.goal_steps where household_id = p_household_id;
  delete from public.productivity_goals where household_id = p_household_id;
  delete from public.time_entries where household_id = p_household_id;
  delete from public.household_tasks where household_id = p_household_id;
  delete from public.time_blocks where household_id = p_household_id;
  delete from public.time_categories
  where household_id = p_household_id and is_system = false;
end;
$$;

revoke all on function public.reset_time_data(uuid) from public, anon;
grant execute on function public.reset_time_data(uuid) to authenticated;

comment on function public.reset_time_data(uuid) is
  'Borra entradas, bloques, tareas, metas y categorías de tiempo personalizadas del hogar.';
