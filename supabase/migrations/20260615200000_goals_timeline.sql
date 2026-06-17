-- Metas timeline + dificultad de tareas

alter table public.productivity_goals
  add column if not exists vision text;

alter table public.goal_steps
  add column if not exists step_type text not null default 'milestone'
    check (step_type in ('milestone', 'action'));

update public.goal_steps
set step_type = case
  when due_date is not null then 'milestone'
  when estimated_minutes is not null then 'action'
  else 'milestone'
end
where step_type = 'milestone';

alter table public.household_tasks
  add column if not exists difficulty smallint not null default 2
    check (difficulty between 1 and 3);
