-- Reset all financial data for a household (keeps hogar, miembros y categorías del sistema)

create or replace function public.reset_household_data(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_household_member(p_household_id) then
    raise exception 'No autorizado';
  end if;

  update public.transactions
  set reconciliation_id = null
  where household_id = p_household_id;

  update public.reconciliations
  set adjustment_transaction_id = null
  where household_id = p_household_id;

  delete from public.transactions where household_id = p_household_id;
  delete from public.reconciliations where household_id = p_household_id;
  delete from public.recurring_schedules where household_id = p_household_id;
  delete from public.savings_goals where household_id = p_household_id;
  delete from public.categories
  where household_id = p_household_id and is_system = false;
end;
$$;

revoke all on function public.reset_household_data(uuid) from public, anon;
grant execute on function public.reset_household_data(uuid) to authenticated;
