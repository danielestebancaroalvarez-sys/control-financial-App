-- Aportes periódicos: automático (registra solo) o recordatorio (aviso manual).

alter table public.savings_goals
  add column if not exists auto_contribute boolean not null default false,
  add column if not exists next_contribution date;

comment on column public.savings_goals.auto_contribute is
  'Si es true, process_due_savings_contributions registra aportes en la fecha programada.';
comment on column public.savings_goals.next_contribution is
  'Fecha ancla del próximo aporte periódico programado.';

update public.savings_goals
set next_contribution = coalesce(created_at::date, current_date)
where contribution_amount is not null
  and contribution_amount > 0
  and next_contribution is null;

alter table public.transactions
  add column if not exists is_savings_contribution_instance boolean not null default false;

create or replace function public.process_due_savings_contributions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  rec record;
  v_next date;
  v_category_id uuid;
  v_freq public.recurrence_frequency;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  for rec in
    select
      sg.id,
      sg.household_id,
      sg.created_by,
      sg.name,
      sg.target_amount,
      sg.current_amount,
      sg.contribution_amount,
      sg.contribution_frequency,
      sg.next_contribution
    from public.savings_goals sg
    where sg.is_active = true
      and sg.auto_contribute = true
      and sg.contribution_amount is not null
      and sg.contribution_amount > 0
      and sg.contribution_frequency is not null
      and sg.next_contribution is not null
      and sg.next_contribution <= current_date
      and sg.current_amount < sg.target_amount
      and private.is_household_member(sg.household_id)
  loop
    v_next := rec.next_contribution;
    v_freq := (rec.contribution_frequency::text)::public.recurrence_frequency;

    select c.id
    into v_category_id
    from public.categories c
    where c.household_id = rec.household_id
      and c.type = 'expense'
      and c.name = 'Ahorro'
    limit 1;

    if v_category_id is null then
      select c.id
      into v_category_id
      from public.categories c
      where c.household_id = rec.household_id
        and c.type = 'expense'
      limit 1;
    end if;

    if v_category_id is null then
      continue;
    end if;

    while v_next <= current_date
      and rec.current_amount < rec.target_amount
    loop
      if not exists (
        select 1
        from public.transactions t
        where t.savings_goal_id = rec.id
          and t.transaction_date = v_next
      ) then
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
          savings_goal_id,
          is_savings_contribution_instance
        )
        select
          rec.household_id,
          rec.created_by,
          v_category_id,
          'expense',
          'Aporte a ' || rec.name,
          v_next,
          rec.contribution_amount,
          h.base_currency,
          1,
          rec.contribution_amount,
          h.base_currency,
          rec.id,
          true
        from public.households h
        where h.id = rec.household_id;

        update public.savings_goals
        set current_amount = least(
              target_amount,
              round((current_amount + rec.contribution_amount)::numeric, 2)
            ),
            updated_at = now()
        where id = rec.id
        returning current_amount into rec.current_amount;

        v_count := v_count + 1;
      end if;

      v_next := private.advance_recurrence(v_next, v_freq);
    end loop;

    update public.savings_goals
    set next_contribution = v_next,
        updated_at = now()
    where id = rec.id;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.process_due_savings_contributions() from public;
grant execute on function public.process_due_savings_contributions() to authenticated;
