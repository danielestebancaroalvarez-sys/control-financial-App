-- Distinguish subscription categories (Netflix, Spotify) from regular spending

alter table public.categories
  add column if not exists is_subscription boolean not null default false;

-- Suscripciones category for existing households
insert into public.categories (household_id, name, type, icon, color, is_fixed, is_subscription, is_system)
select h.id, 'Suscripciones', 'expense', 'tv', '#7E57C2', false, true, true
from public.households h
where not exists (
  select 1 from public.categories c
  where c.household_id = h.id and c.name = 'Suscripciones' and c.type = 'expense'
);

-- Servicios = utilities/rent (not generic "Servicios" name confusion)
update public.categories
set is_subscription = false
where is_fixed = true;

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, name, type, icon, is_fixed, is_subscription, is_system) values
    (new.id, 'Salario',       'income',  'banknote',        false, false, true),
    (new.id, 'Otros ingresos','income',  'plus-circle',     false, false, true),
    (new.id, 'Mercado',       'expense', 'shopping-cart',   false, false, true),
    (new.id, 'Restaurantes',  'expense', 'utensils',        false, false, true),
    (new.id, 'Suscripciones', 'expense', 'tv',              false, true,  true),
    (new.id, 'Arriendo',      'expense', 'home',            true,  false, true),
    (new.id, 'Luz',           'expense', 'zap',             true,  false, true),
    (new.id, 'Internet',      'expense', 'wifi',            true,  false, true),
    (new.id, 'Transporte',    'expense', 'car',             false, false, true),
    (new.id, 'Otros gastos',  'expense', 'more-horizontal', false, false, true);
  return new;
end;
$$;
