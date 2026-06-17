-- Tiempo: frecuencia diaria, hora inicio/fin en bloques y entradas

alter type public.recurrence_frequency add value if not exists 'daily';

alter table public.time_blocks
  add column if not exists end_time time;

alter table public.time_entries
  add column if not exists start_time time,
  add column if not exists end_time time;
