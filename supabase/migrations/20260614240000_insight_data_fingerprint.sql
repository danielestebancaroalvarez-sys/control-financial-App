-- Invalidar insights de IA solo cuando cambian los datos financieros
alter table public.household_weekly_insights
  add column if not exists data_fingerprint text;

comment on column public.household_weekly_insights.data_fingerprint is
  'Hash de métricas del hogar; si coincide, no se vuelve a llamar a la IA';
