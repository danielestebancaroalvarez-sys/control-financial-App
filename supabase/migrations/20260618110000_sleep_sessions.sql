-- Sesiones de sueño (inicio/fin con botón o registro manual)

create table public.sleep_sessions (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households (id) on delete cascade,
  user_id         uuid not null references auth.users (id),
  started_at      timestamptz not null,
  ended_at        timestamptz,
  time_entry_id   uuid references public.time_entries (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_sleep_sessions_household on public.sleep_sessions (household_id);
create index idx_sleep_sessions_user_active on public.sleep_sessions (user_id, ended_at)
  where ended_at is null;

alter table public.sleep_sessions enable row level security;

create policy "sleep_sessions_select" on public.sleep_sessions
  for select to authenticated
  using (private.is_household_member(household_id));

create policy "sleep_sessions_insert" on public.sleep_sessions
  for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and user_id = (select auth.uid())
  );

create policy "sleep_sessions_update" on public.sleep_sessions
  for update to authenticated
  using (private.is_household_member(household_id) and user_id = (select auth.uid()))
  with check (private.is_household_member(household_id) and user_id = (select auth.uid()));

create policy "sleep_sessions_delete" on public.sleep_sessions
  for delete to authenticated
  using (private.is_household_member(household_id) and user_id = (select auth.uid()));

-- Incluir sesiones de sueño en reset de datos de Tiempo
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

  delete from public.sleep_sessions where household_id = p_household_id;
  delete from public.goal_steps where household_id = p_household_id;
  delete from public.productivity_goals where household_id = p_household_id;
  delete from public.time_entries where household_id = p_household_id;
  delete from public.household_tasks where household_id = p_household_id;
  delete from public.time_blocks where household_id = p_household_id;
  delete from public.time_categories
  where household_id = p_household_id and is_system = false;
end;
$$;
