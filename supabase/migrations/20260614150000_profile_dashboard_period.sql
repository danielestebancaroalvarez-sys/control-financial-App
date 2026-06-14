-- Preferencia de periodo del dashboard por usuario (Ajustes)
alter table public.profiles
  add column if not exists dashboard_period text not null default 'monthly'
  check (dashboard_period in ('weekly', 'monthly'));
