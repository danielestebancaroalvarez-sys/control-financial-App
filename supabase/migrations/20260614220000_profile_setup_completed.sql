-- Guía de configuración inicial por usuario
alter table public.profiles
  add column if not exists setup_completed_at timestamptz;

comment on column public.profiles.setup_completed_at is
  'Cuando el usuario completó la guía de datos esenciales (ingresos, fijos, etc.)';

-- No forzar el wizard a quienes ya usaban la app antes de esta migración
update public.profiles
set setup_completed_at = coalesce(setup_completed_at, now())
where setup_completed_at is null;
