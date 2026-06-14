-- Los fijos del radar/presupuesto no deben crear transacciones solos.
-- Solo las plantillas con auto_register = true generan movimientos automáticos.

alter table public.recurring_schedules
  add column if not exists auto_register boolean not null default false;

comment on column public.recurring_schedules.auto_register is
  'Si es true, process_due_recurring_schedules crea transacciones. Los fijos de planificación usan false.';

create or replace function public.process_due_recurring_schedules()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  rec record;
  v_exchange_rate numeric(18, 8);
  v_amount_base numeric(14, 2);
  v_next date;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  for rec in
    select
      rs.id,
      rs.household_id,
      rs.created_by,
      rs.category_id,
      rs.type,
      rs.description,
      rs.amount_original,
      rs.currency_original,
      rs.frequency,
      rs.next_occurrence,
      h.base_currency
    from public.recurring_schedules rs
    join public.households h on h.id = rs.household_id
    where rs.is_active = true
      and rs.auto_register = true
      and rs.next_occurrence <= current_date
      and private.is_household_member(rs.household_id)
  loop
    v_next := rec.next_occurrence;

    while v_next <= current_date loop
      if not exists (
        select 1
        from public.transactions t
        where t.recurring_schedule_id = rec.id
          and t.transaction_date = v_next
          and t.is_recurring_instance = true
      ) then
        if rec.currency_original = rec.base_currency then
          v_exchange_rate := 1;
          v_amount_base := rec.amount_original;
        else
          select er.rate
          into v_exchange_rate
          from public.exchange_rates er
          where er.from_currency = rec.currency_original
            and er.to_currency = rec.base_currency
          order by er.effective_from desc
          limit 1;

          if v_exchange_rate is null then
            exit;
          end if;

          v_amount_base := round(rec.amount_original * v_exchange_rate, 2);
        end if;

        insert into public.transactions (
          household_id,
          created_by,
          category_id,
          type,
          description,
          transaction_date,
          amount_original,
          currency_original,
          exchange_rate,
          amount_base,
          currency_base,
          recurring_schedule_id,
          is_recurring_instance
        ) values (
          rec.household_id,
          rec.created_by,
          rec.category_id,
          rec.type,
          rec.description,
          v_next,
          rec.amount_original,
          rec.currency_original,
          v_exchange_rate,
          v_amount_base,
          rec.base_currency,
          rec.id,
          true
        );

        v_count := v_count + 1;
      end if;

      v_next := private.advance_recurrence(v_next, rec.frequency);
    end loop;

    update public.recurring_schedules
    set next_occurrence = v_next,
        updated_at = now()
    where id = rec.id;
  end loop;

  return v_count;
end;
$$;
