-- Configuración inicial del módulo Tiempo (por usuario)

alter table public.profiles
  add column if not exists time_setup_completed_at timestamptz;

comment on column public.profiles.setup_completed_at is
  'Finanzas: usuario completó o saltó el asistente de configuración inicial.';

comment on column public.profiles.time_setup_completed_at is
  'Tiempo: usuario completó o saltó el asistente de configuración del módulo.';

update public.profiles
set time_setup_completed_at = coalesce(time_setup_completed_at, now())
where time_setup_completed_at is null
  and setup_completed_at is not null;
