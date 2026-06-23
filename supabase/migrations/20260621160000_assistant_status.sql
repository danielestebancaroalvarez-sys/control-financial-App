-- Contextual setup assistant status per module
alter table public.profiles
  add column if not exists assistant_finance_status text not null default 'unset',
  add column if not exists assistant_time_status text not null default 'unset',
  add column if not exists assistant_welcome_seen_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_assistant_finance_status_check;

alter table public.profiles
  add constraint profiles_assistant_finance_status_check
  check (assistant_finance_status in ('unset', 'active', 'declined', 'completed'));

alter table public.profiles
  drop constraint if exists profiles_assistant_time_status_check;

alter table public.profiles
  add constraint profiles_assistant_time_status_check
  check (assistant_time_status in ('unset', 'active', 'declined', 'completed'));
