-- Eliminación completa de cuenta de usuario (GDPR / derecho al olvido)

create or replace function public.delete_user_account()
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_member_count int;
  v_successor uuid;
  v_deleted_households uuid[] := '{}';
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  for v_household_id in
    select household_id from public.household_members where user_id = v_user_id
  loop
    select count(*)::int into v_member_count
    from public.household_members
    where household_id = v_household_id;

    if v_member_count <= 1 then
      v_deleted_households := array_append(v_deleted_households, v_household_id);
      delete from public.households where id = v_household_id;
    else
      select hm.user_id into v_successor
      from public.household_members hm
      where hm.household_id = v_household_id
        and hm.user_id != v_user_id
      order by hm.joined_at asc
      limit 1;

      if v_successor is null then
        raise exception 'No se pudo resolver el hogar compartido';
      end if;

      update public.transactions
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.recurring_schedules
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.savings_goals
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.reconciliations
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.time_blocks
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.time_blocks
      set assigned_to = null
      where household_id = v_household_id and assigned_to = v_user_id;

      delete from public.time_entries
      where household_id = v_household_id and user_id = v_user_id;

      update public.household_tasks
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.household_tasks
      set assigned_to = null
      where household_id = v_household_id and assigned_to = v_user_id;

      update public.household_task_templates
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.productivity_goals
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.goal_steps
      set assigned_to = null
      where household_id = v_household_id and assigned_to = v_user_id;

      update public.trips
      set created_by = v_successor
      where household_id = v_household_id and created_by = v_user_id;

      update public.trip_prep_steps
      set assigned_to = null
      where household_id = v_household_id and assigned_to = v_user_id;

      perform public.leave_household(v_household_id);
    end if;
  end loop;

  delete from public.sleep_sessions where user_id = v_user_id;
  delete from public.profiles where id = v_user_id;

  return v_deleted_households;
end;
$$;

revoke all on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;

comment on function public.delete_user_account() is
  'Elimina membresías, datos personales y hogares sin otros miembros. Devuelve IDs de hogares borrados (para limpiar storage).';
