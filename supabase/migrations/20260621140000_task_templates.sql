-- Plantillas de actividades reutilizables (módulo Tiempo)

create table public.household_task_templates (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  created_by        uuid not null references auth.users (id),
  title             text not null,
  description       text,
  estimated_minutes integer not null check (estimated_minutes > 0),
  difficulty        smallint not null default 2 check (difficulty between 1 and 3),
  icon              text default 'package',
  color             text default '#6366F1',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_household_task_templates_household
  on public.household_task_templates (household_id)
  where is_active = true;

alter table public.household_tasks
  add column if not exists template_id uuid
    references public.household_task_templates (id) on delete set null;

create trigger household_task_templates_updated_at
  before update on public.household_task_templates
  for each row execute function public.set_updated_at();

alter table public.household_task_templates enable row level security;

create policy "household_task_templates_select" on public.household_task_templates
  for select to authenticated
  using (private.is_household_member(household_id));

create policy "household_task_templates_insert" on public.household_task_templates
  for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );

create policy "household_task_templates_update" on public.household_task_templates
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

create policy "household_task_templates_delete" on public.household_task_templates
  for delete to authenticated
  using (private.is_household_member(household_id));

alter table public.household_task_templates replica identity full;
alter publication supabase_realtime add table public.household_task_templates;
