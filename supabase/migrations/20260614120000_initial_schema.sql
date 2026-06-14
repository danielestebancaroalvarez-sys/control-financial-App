-- ============================================================
-- CoupleCash MVP — Fase 0: Esquema inicial
-- Núcleo: households | RLS estricto por pareja/hogar
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SCHEMA PRIVADO (helpers RLS, no expuestos vía API)
-- ────────────────────────────────────────────────────────────

create schema if not exists private;

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

create type public.currency_code as enum ('AUD', 'COP');
create type public.member_role as enum ('owner', 'member');
create type public.transaction_type as enum ('income', 'expense', 'adjustment');
create type public.recurrence_frequency as enum ('weekly', 'biweekly', 'monthly');
create type public.savings_mode as enum ('static', 'compound');
create type public.contribution_frequency as enum ('weekly', 'biweekly', 'monthly');

-- ────────────────────────────────────────────────────────────
-- TABLAS
-- ────────────────────────────────────────────────────────────

-- 1. Perfiles (extensión de auth.users)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  theme       text not null default 'light' check (theme in ('light', 'dark')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Hogares — entidad raíz
create table public.households (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  base_currency public.currency_code not null default 'AUD',
  invite_code   text not null unique,
  created_by    uuid not null references auth.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_households_invite_code on public.households (invite_code);

-- 3. Miembros del hogar
create table public.household_members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          public.member_role not null default 'member',
  joined_at     timestamptz not null default now(),
  unique (household_id, user_id)
);

create index idx_hm_user on public.household_members (user_id);
create index idx_hm_household on public.household_members (household_id);

-- 4. Tasas de cambio (MVP: estáticas)
create table public.exchange_rates (
  id              uuid primary key default gen_random_uuid(),
  from_currency   public.currency_code not null,
  to_currency     public.currency_code not null,
  rate            numeric(18, 8) not null check (rate > 0),
  effective_from  date not null default current_date,
  created_at      timestamptz not null default now(),
  unique (from_currency, to_currency, effective_from)
);

-- 5. Categorías por hogar
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  name          text not null,
  type          public.transaction_type not null
    check (type in ('income', 'expense')),
  icon          text,
  color         text,
  is_fixed      boolean not null default false,
  is_system     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (household_id, name, type)
);

create index idx_categories_household on public.categories (household_id);

-- 6. Plantillas recurrentes
create table public.recurring_schedules (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  created_by        uuid not null references auth.users (id),
  category_id       uuid not null references public.categories (id),
  type              public.transaction_type not null
    check (type in ('income', 'expense')),
  description       text not null,
  amount_original   numeric(14, 2) not null check (amount_original > 0),
  currency_original public.currency_code not null,
  frequency         public.recurrence_frequency not null,
  next_occurrence   date not null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_recurring_household on public.recurring_schedules (household_id);

-- 7. Reconciliaciones bancarias
create table public.reconciliations (
  id                        uuid primary key default gen_random_uuid(),
  household_id              uuid not null references public.households (id) on delete cascade,
  created_by                uuid not null references auth.users (id),
  app_balance               numeric(14, 2) not null,
  bank_balance              numeric(14, 2) not null,
  adjustment_amount         numeric(14, 2) not null,
  adjustment_transaction_id uuid,
  notes                     text,
  created_at                timestamptz not null default now()
);

create index idx_reconciliations_household on public.reconciliations (household_id);

-- 8. Metas de ahorro
create table public.savings_goals (
  id                      uuid primary key default gen_random_uuid(),
  household_id            uuid not null references public.households (id) on delete cascade,
  created_by              uuid not null references auth.users (id),
  name                    text not null,
  target_amount           numeric(14, 2) not null check (target_amount > 0),
  current_amount          numeric(14, 2) not null default 0 check (current_amount >= 0),
  target_date             date,
  contribution_amount     numeric(14, 2) check (contribution_amount >= 0),
  contribution_frequency  public.contribution_frequency,
  savings_mode            public.savings_mode not null default 'static',
  annual_interest_rate    numeric(6, 4) default 0 check (annual_interest_rate >= 0),
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_savings_household on public.savings_goals (household_id);

-- 9. Transacciones — libro mayor del hogar
create table public.transactions (
  id                      uuid primary key default gen_random_uuid(),
  household_id            uuid not null references public.households (id) on delete cascade,
  created_by              uuid not null references auth.users (id),
  category_id             uuid references public.categories (id),
  type                    public.transaction_type not null,
  description             text not null,
  transaction_date        date not null default current_date,
  amount_original         numeric(14, 2) not null,
  currency_original       public.currency_code not null,
  exchange_rate           numeric(18, 8) not null default 1,
  amount_base             numeric(14, 2) not null,
  currency_base           public.currency_code not null,
  line_items              jsonb,
  recurring_schedule_id   uuid references public.recurring_schedules (id) on delete set null,
  is_recurring_instance   boolean not null default false,
  reconciliation_id     uuid references public.reconciliations (id) on delete set null,
  is_auto_adjustment      boolean not null default false,
  savings_goal_id         uuid references public.savings_goals (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (
    (type = 'adjustment' and category_id is null)
    or (type in ('income', 'expense') and category_id is not null)
  )
);

create index idx_tx_household_date on public.transactions (household_id, transaction_date desc);
create index idx_tx_household_type on public.transactions (household_id, type);
create index idx_tx_created_by on public.transactions (created_by);
create index idx_tx_category on public.transactions (category_id);
create index idx_tx_line_items on public.transactions using gin (line_items);

-- FK circular: reconciliations → transactions
alter table public.reconciliations
  add constraint fk_reconciliations_adjustment_tx
  foreign key (adjustment_transaction_id)
  references public.transactions (id)
  on delete set null;

-- ────────────────────────────────────────────────────────────
-- FUNCIONES HELPER (schema private)
-- ────────────────────────────────────────────────────────────

create or replace function private.is_household_member(p_household_id uuid)
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
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.my_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.household_members
  where user_id = (select auth.uid());
$$;

create or replace function private.is_household_owner(p_household_id uuid)
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
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

-- Generar código de invitación único (8 chars)
create or replace function private.generate_invite_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    select exists (select 1 from public.households where invite_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

-- Actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- TRIGGERS
-- ────────────────────────────────────────────────────────────

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-generar invite_code si no se proporciona
create or replace function public.handle_new_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    new.invite_code := private.generate_invite_code();
  end if;
  return new;
end;
$$;

create trigger on_household_before_insert
  before insert on public.households
  for each row execute function public.handle_new_household();

-- Al crear hogar, el creador se une como owner
create or replace function public.handle_household_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_household_created
  after insert on public.households
  for each row execute function public.handle_household_created();

-- Sembrar categorías por defecto al crear hogar
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, name, type, icon, is_fixed, is_system) values
    (new.id, 'Salario',      'income',  'banknote',   false, true),
    (new.id, 'Otros ingresos','income', 'plus-circle', false, true),
    (new.id, 'Mercado',      'expense', 'shopping-cart', false, true),
    (new.id, 'Restaurantes', 'expense', 'utensils',   false, true),
    (new.id, 'Servicios',    'expense', 'wrench',     false, true),
    (new.id, 'Arriendo',     'expense', 'home',       true,  true),
    (new.id, 'Luz',          'expense', 'zap',        true,  true),
    (new.id, 'Internet',     'expense', 'wifi',       true,  true),
    (new.id, 'Transporte',   'expense', 'car',        false, true),
    (new.id, 'Otros gastos', 'expense', 'more-horizontal', false, true);
  return new;
end;
$$;

create trigger on_household_seed_categories
  after insert on public.households
  for each row execute function public.seed_default_categories();

-- updated_at en tablas relevantes
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_households_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger set_recurring_updated_at
  before update on public.recurring_schedules
  for each row execute function public.set_updated_at();

create trigger set_savings_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- SEED: Tasas de cambio estáticas (MVP)
-- ────────────────────────────────────────────────────────────

insert into public.exchange_rates (from_currency, to_currency, rate) values
  ('AUD', 'COP', 2600.00000000),
  ('COP', 'AUD',    0.00038462);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.savings_goals enable row level security;
alter table public.reconciliations enable row level security;
alter table public.exchange_rates enable row level security;

-- PROFILES
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- HOUSEHOLDS
create policy "households_select_member"
  on public.households for select to authenticated
  using (id in (select private.my_household_ids()));

create policy "households_insert_own"
  on public.households for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "households_update_owner"
  on public.households for update to authenticated
  using (private.is_household_owner(id))
  with check (private.is_household_owner(id));

-- HOUSEHOLD_MEMBERS
create policy "members_select_same_household"
  on public.household_members for select to authenticated
  using (household_id in (select private.my_household_ids()));

create policy "members_insert_self"
  on public.household_members for insert to authenticated
  with check (user_id = (select auth.uid()));

-- CATEGORIES
create policy "categories_select_member"
  on public.categories for select to authenticated
  using (private.is_household_member(household_id));

create policy "categories_insert_member"
  on public.categories for insert to authenticated
  with check (private.is_household_member(household_id));

create policy "categories_update_member"
  on public.categories for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

create policy "categories_delete_member"
  on public.categories for delete to authenticated
  using (private.is_household_member(household_id) and is_system = false);

-- TRANSACTIONS
create policy "transactions_select_member"
  on public.transactions for select to authenticated
  using (private.is_household_member(household_id));

create policy "transactions_insert_member"
  on public.transactions for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );

create policy "transactions_update_member"
  on public.transactions for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

create policy "transactions_delete_member"
  on public.transactions for delete to authenticated
  using (private.is_household_member(household_id));

-- RECURRING_SCHEDULES
create policy "recurring_select_member"
  on public.recurring_schedules for select to authenticated
  using (private.is_household_member(household_id));

create policy "recurring_insert_member"
  on public.recurring_schedules for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );

create policy "recurring_update_member"
  on public.recurring_schedules for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

create policy "recurring_delete_member"
  on public.recurring_schedules for delete to authenticated
  using (private.is_household_member(household_id));

-- SAVINGS_GOALS
create policy "savings_select_member"
  on public.savings_goals for select to authenticated
  using (private.is_household_member(household_id));

create policy "savings_insert_member"
  on public.savings_goals for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );

create policy "savings_update_member"
  on public.savings_goals for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

create policy "savings_delete_member"
  on public.savings_goals for delete to authenticated
  using (private.is_household_member(household_id));

-- RECONCILIATIONS
create policy "reconciliations_select_member"
  on public.reconciliations for select to authenticated
  using (private.is_household_member(household_id));

create policy "reconciliations_insert_member"
  on public.reconciliations for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and created_by = (select auth.uid())
  );

-- EXCHANGE_RATES (lectura para todos los autenticados)
create policy "rates_select_authenticated"
  on public.exchange_rates for select to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────
-- RPC: Unirse a hogar por código de invitación
-- ────────────────────────────────────────────────────────────

create or replace function public.join_household_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_household_id
  from public.households
  where upper(invite_code) = upper(p_invite_code);

  if v_household_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_user_id, 'member')
  on conflict (household_id, user_id) do nothing;

  return v_household_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- GRANTS
-- ────────────────────────────────────────────────────────────

grant usage on schema private to postgres, service_role;
grant execute on function private.is_household_member(uuid) to authenticated, service_role;
grant execute on function private.my_household_ids() to authenticated, service_role;
grant execute on function private.is_household_owner(uuid) to authenticated, service_role;
grant execute on function public.join_household_by_code(text) to authenticated;
