-- Categoría de gasto para aportes reales a metas de ahorro
insert into public.categories (household_id, name, type, icon, color, is_fixed, is_subscription, is_system)
select h.id, 'Ahorro', 'expense', 'piggy-bank', '#F59E0B', false, false, true
from public.households h
where not exists (
  select 1 from public.categories c
  where c.household_id = h.id and c.name = 'Ahorro' and c.type = 'expense'
);

-- Reclasificar aportes existentes vinculados a metas
update public.transactions t
set category_id = ahorro.id
from public.categories ahorro
where t.savings_goal_id is not null
  and t.type = 'expense'
  and ahorro.household_id = t.household_id
  and ahorro.name = 'Ahorro'
  and ahorro.type = 'expense';

-- Incluir Ahorro en categorías por defecto de hogares nuevos
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
    (new.id, 'Ahorro',        'expense', 'piggy-bank',      false, false, true),
    (new.id, 'Otros gastos',  'expense', 'more-horizontal', false, false, true);
  return new;
end;
$$;
