-- Migrar quincenal (+14 días) a mensual para alinear con vistas semanal/mensual de la app
update public.recurring_schedules
set frequency = 'monthly'
where frequency = 'biweekly';

update public.savings_goals
set contribution_frequency = 'monthly'
where contribution_frequency = 'biweekly';

-- Suscripciones existentes: débito automático por defecto
update public.recurring_schedules rs
set auto_register = true
from public.categories c
where c.id = rs.category_id
  and c.is_subscription = true
  and rs.is_active = true
  and rs.type = 'expense';
