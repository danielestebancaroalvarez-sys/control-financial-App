-- Personalización de tareas + horario en calendario

alter table public.household_tasks
  add column if not exists color text default '#6366F1',
  add column if not exists icon text default 'package',
  add column if not exists scheduled_start time,
  add column if not exists scheduled_end time;
