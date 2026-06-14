-- Categorías visuales para metas de ahorro
alter table public.savings_goals
  add column if not exists category text not null default 'other',
  add column if not exists icon text not null default 'piggy-bank',
  add column if not exists color text not null default '#F59E0B';

update public.savings_goals
set
  category = coalesce(nullif(category, ''), 'other'),
  icon = coalesce(nullif(icon, ''), 'piggy-bank'),
  color = coalesce(nullif(color, ''), '#F59E0B')
where category is null or icon is null or color is null;
