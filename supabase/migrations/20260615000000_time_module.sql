-- ============================================================
-- Couple Hub: módulo Tiempo y Productividad
-- ============================================================

create type public.task_status as enum ('pending', 'done', 'cancelled');
create type public.goal_step_status as enum ('pending', 'done');

-- Categorías de tiempo por hogar
create table public.time_categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  name          text not null,
  icon          text,
  color         text,
  is_system     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (household_id, name)
);

create index idx_time_categories_household on public.time_categories (household_id);

-- Bloques fijos recurrentes (trabajo, universidad, sueño objetivo…)
create table public.time_blocks (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  created_by        uuid not null references auth.users (id),
  category_id       uuid not null references public.time_categories (id),
  assigned_to       uuid references auth.users (id),
  title             text not null,
  frequency         public.recurrence_frequency not null default 'weekly',
  anchor_date       date not null,
  duration_minutes  integer not null check (duration_minutes > 0),
  start_time        time,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_time_blocks_household on public.time_blocks (household_id);

-- Registros reales de tiempo
create table public.time_entries (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  user_id           uuid not null references auth.users (id),
  category_id       uuid not null references public.time_categories (id),
  title             text not null,
  entry_date        date not null,
  duration_minutes  integer not null check (duration_minutes > 0),
  time_block_id     uuid references public.time_blocks (id) on delete set null,
  task_id           uuid,
  created_at        timestamptz not null default now()
);

create index idx_time_entries_household on public.time_entries (household_id);
create index idx_time_entries_date on public.time_entries (household_id, entry_date);

-- Tareas del hogar (variables, asignables)
create table public.household_tasks (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  created_by        uuid not null references auth.users (id),
  assigned_to       uuid references auth.users (id),
  title             text not null,
  description       text,
  due_date          date,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  status            public.task_status not null default 'pending',
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_household_tasks_household on public.household_tasks (household_id);
create index idx_household_tasks_assigned on public.household_tasks (household_id, assigned_to, status);

alter table public.time_entries
  add constraint fk_time_entries_task
  foreign key (task_id) references public.household_tasks (id) on delete set null;

-- Metas de productividad
create table public.productivity_goals (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  created_by    uuid not null references auth.users (id),
  title         text not null,
  target_date   date,
  color         text,
  icon          text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_productivity_goals_household on public.productivity_goals (household_id);

-- Pasos de cada meta
create table public.goal_steps (
  id                uuid primary key default gen_random_uuid(),
  goal_id           uuid not null references public.productivity_goals (id) on delete cascade,
  household_id      uuid not null references public.households (id) on delete cascade,
  title             text not null,
  step_order        integer not null default 0,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  due_date          date,
  assigned_to       uuid references auth.users (id),
  status            public.goal_step_status not null default 'pending',
  completed_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index idx_goal_steps_goal on public.goal_steps (goal_id);

-- Seed categorías de tiempo
create or replace function public.seed_default_time_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.time_categories (household_id, name, icon, color, is_system) values
    (new.id, 'Trabajo',      'briefcase',     '#6366F1', true),
    (new.id, 'Universidad',  'graduation-cap','#8B5CF6', true),
    (new.id, 'Sueño',        'moon',          '#4F46E5', true),
    (new.id, 'Hogar',        'home',          '#A78BFA', true),
    (new.id, 'Ocio',         'gamepad-2',     '#C4B5FD', true),
    (new.id, 'Tránsito',     'car',           '#818CF8', true),
    (new.id, 'Ejercicio',    'dumbbell',      '#7C3AED', true),
    (new.id, 'Otros',        'more-horizontal','#94A3B8', true);
  return new;
end;
$$;

drop trigger if exists on_household_seed_time_categories on public.households;
create trigger on_household_seed_time_categories
  after insert on public.households
  for each row execute function public.seed_default_time_categories();

-- Backfill hogares existentes
insert into public.time_categories (household_id, name, icon, color, is_system)
select h.id, v.name, v.icon, v.color, true
from public.households h
cross join (
  values
    ('Trabajo',      'briefcase',      '#6366F1'),
    ('Universidad',  'graduation-cap', '#8B5CF6'),
    ('Sueño',        'moon',           '#4F46E5'),
    ('Hogar',        'home',           '#A78BFA'),
    ('Ocio',         'gamepad-2',      '#C4B5FD'),
    ('Tránsito',     'car',            '#818CF8'),
    ('Ejercicio',    'dumbbell',       '#7C3AED'),
    ('Otros',        'more-horizontal','#94A3B8')
) as v(name, icon, color)
where not exists (
  select 1 from public.time_categories tc
  where tc.household_id = h.id and tc.name = v.name
);

-- updated_at triggers
create trigger time_blocks_updated_at
  before update on public.time_blocks
  for each row execute function public.set_updated_at();

create trigger household_tasks_updated_at
  before update on public.household_tasks
  for each row execute function public.set_updated_at();

create trigger productivity_goals_updated_at
  before update on public.productivity_goals
  for each row execute function public.set_updated_at();

-- RLS
alter table public.time_categories enable row level security;
alter table public.time_blocks enable row level security;
alter table public.time_entries enable row level security;
alter table public.household_tasks enable row level security;
alter table public.productivity_goals enable row level security;
alter table public.goal_steps enable row level security;

create policy "time_categories_select" on public.time_categories for select to authenticated
  using (private.is_household_member(household_id));
create policy "time_categories_insert" on public.time_categories for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "time_categories_update" on public.time_categories for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "time_categories_delete" on public.time_categories for delete to authenticated
  using (private.is_household_member(household_id) and is_system = false);

create policy "time_blocks_select" on public.time_blocks for select to authenticated
  using (private.is_household_member(household_id));
create policy "time_blocks_insert" on public.time_blocks for insert to authenticated
  with check (private.is_household_member(household_id) and created_by = (select auth.uid()));
create policy "time_blocks_update" on public.time_blocks for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "time_blocks_delete" on public.time_blocks for delete to authenticated
  using (private.is_household_member(household_id));

create policy "time_entries_select" on public.time_entries for select to authenticated
  using (private.is_household_member(household_id));
create policy "time_entries_insert" on public.time_entries for insert to authenticated
  with check (private.is_household_member(household_id) and user_id = (select auth.uid()));
create policy "time_entries_update" on public.time_entries for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "time_entries_delete" on public.time_entries for delete to authenticated
  using (private.is_household_member(household_id));

create policy "household_tasks_select" on public.household_tasks for select to authenticated
  using (private.is_household_member(household_id));
create policy "household_tasks_insert" on public.household_tasks for insert to authenticated
  with check (private.is_household_member(household_id) and created_by = (select auth.uid()));
create policy "household_tasks_update" on public.household_tasks for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "household_tasks_delete" on public.household_tasks for delete to authenticated
  using (private.is_household_member(household_id));

create policy "productivity_goals_select" on public.productivity_goals for select to authenticated
  using (private.is_household_member(household_id));
create policy "productivity_goals_insert" on public.productivity_goals for insert to authenticated
  with check (private.is_household_member(household_id) and created_by = (select auth.uid()));
create policy "productivity_goals_update" on public.productivity_goals for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "productivity_goals_delete" on public.productivity_goals for delete to authenticated
  using (private.is_household_member(household_id));

create policy "goal_steps_select" on public.goal_steps for select to authenticated
  using (private.is_household_member(household_id));
create policy "goal_steps_insert" on public.goal_steps for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "goal_steps_update" on public.goal_steps for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "goal_steps_delete" on public.goal_steps for delete to authenticated
  using (private.is_household_member(household_id));

revoke all on function public.seed_default_time_categories() from public, anon, authenticated;

-- Realtime
alter table public.time_blocks replica identity full;
alter table public.time_entries replica identity full;
alter table public.household_tasks replica identity full;
alter table public.productivity_goals replica identity full;
alter table public.goal_steps replica identity full;

alter publication supabase_realtime add table public.time_blocks;
alter publication supabase_realtime add table public.time_entries;
alter publication supabase_realtime add table public.household_tasks;
alter publication supabase_realtime add table public.productivity_goals;
alter publication supabase_realtime add table public.goal_steps;
