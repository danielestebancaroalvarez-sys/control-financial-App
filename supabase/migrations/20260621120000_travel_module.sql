-- ============================================================
-- Couple Hub: módulo Viajes
-- ============================================================

create type public.trip_status as enum (
  'planning',
  'saving',
  'booked',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.trip_budget_category as enum (
  'flights',
  'hotels',
  'transport',
  'insurance',
  'visas',
  'activities',
  'food',
  'shopping',
  'other'
);

create type public.trip_split_mode as enum ('equal', 'custom');

create type public.trip_prep_step_type as enum ('milestone', 'action');

create type public.trip_prep_category as enum (
  'booking',
  'visa',
  'packing',
  'payment',
  'research',
  'other'
);

create type public.trip_daily_category as enum (
  'food',
  'local_transport',
  'activities',
  'misc'
);

create table public.trips (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  created_by        uuid not null references auth.users (id),
  name              text not null,
  destination       text not null,
  destination_country text,
  start_date        date not null,
  end_date          date not null,
  travelers_count   integer not null default 2 check (travelers_count > 0),
  status            public.trip_status not null default 'planning',
  savings_goal_id   uuid references public.savings_goals (id) on delete set null,
  cover_image_path  text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (end_date >= start_date)
);

create index idx_trips_household on public.trips (household_id);
create index idx_trips_status on public.trips (household_id, status);
create index idx_trips_dates on public.trips (household_id, start_date);

create table public.trip_budget_items (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             uuid not null references public.trips (id) on delete cascade,
  household_id        uuid not null references public.households (id) on delete cascade,
  category            public.trip_budget_category not null,
  name                text not null,
  description         text,
  quantity            numeric(12, 2) not null default 1 check (quantity > 0),
  unit_amount         numeric(14, 2) not null default 0 check (unit_amount >= 0),
  currency            text not null default 'AUD',
  amount_total        numeric(14, 2) not null default 0 check (amount_total >= 0),
  split_mode          public.trip_split_mode not null default 'equal',
  split_allocations   jsonb,
  due_date            date,
  is_booked           boolean not null default false,
  booking_url         text,
  booking_reference   text,
  amount_actual       numeric(14, 2) check (amount_actual is null or amount_actual >= 0),
  price_updated_at    timestamptz,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_trip_budget_items_trip on public.trip_budget_items (trip_id);

create table public.trip_prep_steps (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             uuid not null references public.trips (id) on delete cascade,
  household_id        uuid not null references public.households (id) on delete cascade,
  title               text not null,
  description         text,
  step_type           public.trip_prep_step_type not null default 'milestone',
  step_order          integer not null default 0,
  category            public.trip_prep_category not null default 'other',
  due_date            date,
  estimated_cost      numeric(14, 2) check (estimated_cost is null or estimated_cost >= 0),
  is_completed        boolean not null default false,
  completed_at        timestamptz,
  assigned_to         uuid references auth.users (id),
  household_task_id   uuid references public.household_tasks (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_trip_prep_steps_trip on public.trip_prep_steps (trip_id);

create table public.trip_itinerary_days (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips (id) on delete cascade,
  household_id  uuid not null references public.households (id) on delete cascade,
  day_date      date not null,
  day_number    integer not null check (day_number > 0),
  title         text,
  created_at    timestamptz not null default now(),
  unique (trip_id, day_number)
);

create index idx_trip_itinerary_days_trip on public.trip_itinerary_days (trip_id);

create table public.trip_itinerary_activities (
  id              uuid primary key default gen_random_uuid(),
  day_id          uuid not null references public.trip_itinerary_days (id) on delete cascade,
  household_id    uuid not null references public.households (id) on delete cascade,
  title           text not null,
  start_time      time,
  end_time        time,
  location        text,
  category        text,
  estimated_cost  numeric(14, 2) check (estimated_cost is null or estimated_cost >= 0),
  notes           text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_trip_itinerary_activities_day on public.trip_itinerary_activities (day_id);

create table public.trip_daily_estimates (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips (id) on delete cascade,
  household_id    uuid not null references public.households (id) on delete cascade,
  category        public.trip_daily_category not null,
  amount_per_day  numeric(14, 2) not null default 0 check (amount_per_day >= 0),
  days_count      integer not null default 1 check (days_count > 0),
  notes           text,
  created_at      timestamptz not null default now(),
  unique (trip_id, category)
);

create index idx_trip_daily_estimates_trip on public.trip_daily_estimates (trip_id);

alter table public.profiles
  add column if not exists travel_setup_completed_at timestamptz;

-- updated_at triggers
create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create trigger trip_budget_items_updated_at
  before update on public.trip_budget_items
  for each row execute function public.set_updated_at();

create trigger trip_prep_steps_updated_at
  before update on public.trip_prep_steps
  for each row execute function public.set_updated_at();

-- RLS
alter table public.trips enable row level security;
alter table public.trip_budget_items enable row level security;
alter table public.trip_prep_steps enable row level security;
alter table public.trip_itinerary_days enable row level security;
alter table public.trip_itinerary_activities enable row level security;
alter table public.trip_daily_estimates enable row level security;

create policy "trips_select" on public.trips for select to authenticated
  using (private.is_household_member(household_id));
create policy "trips_insert" on public.trips for insert to authenticated
  with check (private.is_household_member(household_id) and created_by = (select auth.uid()));
create policy "trips_update" on public.trips for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "trips_delete" on public.trips for delete to authenticated
  using (private.is_household_member(household_id));

create policy "trip_budget_items_select" on public.trip_budget_items for select to authenticated
  using (private.is_household_member(household_id));
create policy "trip_budget_items_insert" on public.trip_budget_items for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "trip_budget_items_update" on public.trip_budget_items for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "trip_budget_items_delete" on public.trip_budget_items for delete to authenticated
  using (private.is_household_member(household_id));

create policy "trip_prep_steps_select" on public.trip_prep_steps for select to authenticated
  using (private.is_household_member(household_id));
create policy "trip_prep_steps_insert" on public.trip_prep_steps for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "trip_prep_steps_update" on public.trip_prep_steps for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "trip_prep_steps_delete" on public.trip_prep_steps for delete to authenticated
  using (private.is_household_member(household_id));

create policy "trip_itinerary_days_select" on public.trip_itinerary_days for select to authenticated
  using (private.is_household_member(household_id));
create policy "trip_itinerary_days_insert" on public.trip_itinerary_days for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "trip_itinerary_days_update" on public.trip_itinerary_days for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "trip_itinerary_days_delete" on public.trip_itinerary_days for delete to authenticated
  using (private.is_household_member(household_id));

create policy "trip_itinerary_activities_select" on public.trip_itinerary_activities for select to authenticated
  using (private.is_household_member(household_id));
create policy "trip_itinerary_activities_insert" on public.trip_itinerary_activities for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "trip_itinerary_activities_update" on public.trip_itinerary_activities for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "trip_itinerary_activities_delete" on public.trip_itinerary_activities for delete to authenticated
  using (private.is_household_member(household_id));

create policy "trip_daily_estimates_select" on public.trip_daily_estimates for select to authenticated
  using (private.is_household_member(household_id));
create policy "trip_daily_estimates_insert" on public.trip_daily_estimates for insert to authenticated
  with check (private.is_household_member(household_id));
create policy "trip_daily_estimates_update" on public.trip_daily_estimates for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));
create policy "trip_daily_estimates_delete" on public.trip_daily_estimates for delete to authenticated
  using (private.is_household_member(household_id));

-- Realtime
alter table public.trips replica identity full;
alter table public.trip_budget_items replica identity full;
alter table public.trip_prep_steps replica identity full;
alter table public.trip_itinerary_days replica identity full;
alter table public.trip_itinerary_activities replica identity full;
alter table public.trip_daily_estimates replica identity full;

alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.trip_budget_items;
alter publication supabase_realtime add table public.trip_prep_steps;
alter publication supabase_realtime add table public.trip_itinerary_days;
alter publication supabase_realtime add table public.trip_itinerary_activities;
alter publication supabase_realtime add table public.trip_daily_estimates;
