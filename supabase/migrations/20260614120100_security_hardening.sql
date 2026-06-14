-- Security hardening: revoke RPC access on internal trigger functions

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_new_household() from public, anon, authenticated;
revoke all on function public.handle_household_created() from public, anon, authenticated;
revoke all on function public.seed_default_categories() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

revoke all on function public.join_household_by_code(text) from public, anon;
grant execute on function public.join_household_by_code(text) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.generate_invite_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    select exists (select 1 from public.households where invite_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;
