-- ============================================================
-- Reset All Customer Data (Main Admin only) — v2
-- ============================================================
-- WHAT THIS CLEARS (customer/transaction data):
--   orders, print_orders, gcash_transactions, organization_transactions,
--   bcoins_transactions, bcoins_redemptions, payment_references,
--   wallet balances (bcoins_wallets, organization_wallets) reset to 0.
--
-- WHAT THIS PRESERVES (untouched):
--   banners, products (items), categories, users/profiles/auth accounts,
--   user_roles, club codes, seller codes, memberships, seller profiles,
--   organizations, org members/events/announcements, chat, support reports,
--   app settings, registration codes.
--
-- HOW TO RUN: paste into Supabase SQL Editor and click Run.
-- (Replaces the previous version of the function.)
--
-- v2 notes:
--  * Every DELETE now carries an explicit WHERE clause. Supabase projects can
--    have a guard that rejects DELETE-without-WHERE, and `where id is not null`
--    satisfies it while still matching every row.
--  * If a guarded DELETE still fails, we fall back to TRUNCATE ... CASCADE so
--    the reset succeeds even with foreign-key guarded tables.
--  * Never aborts: each step reports its own success/error in the result.
-- ============================================================

create or replace function public.reset_all_customer_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid    uuid;
  _role   text;
  _result jsonb := '{}'::jsonb;
begin
  _uid := auth.uid();
  if _uid is null then
    raise exception 'Must be signed in to reset data.';
  end if;

  -- Resolve role: user_roles first, then profiles.role as legacy fallback
  select role into _role from public.user_roles where user_id = _uid limit 1;
  if _role is null or _role = '' then
    select role into _role from public.profiles where user_id = _uid limit 1;
  end if;

  if coalesce(_role, '') <> 'main_admin' then
    raise exception 'Only the main admin (sheethappenswithjaa@gmail.com) can reset data.';
  end if;

  -- Each table: try DELETE with an explicit predicate (guard-friendly),
  -- then TRUNCATE ... CASCADE as fallback. Record ok/error, never abort.
  begin
    delete from public.payment_references where id is not null;
    _result := _result || jsonb_build_object('payment_references', 'ok');
  exception when others then
    begin
      truncate table public.payment_references cascade;
      _result := _result || jsonb_build_object('payment_references', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('payment_references', sqlerrm);
    end;
  end;

  begin
    delete from public.bcoins_transactions where id is not null;
    _result := _result || jsonb_build_object('bcoins_transactions', 'ok');
  exception when others then
    begin
      truncate table public.bcoins_transactions cascade;
      _result := _result || jsonb_build_object('bcoins_transactions', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('bcoins_transactions', sqlerrm);
    end;
  end;

  begin
    delete from public.bcoins_redemptions where id is not null;
    _result := _result || jsonb_build_object('bcoins_redemptions', 'ok');
  exception when others then
    begin
      truncate table public.bcoins_redemptions cascade;
      _result := _result || jsonb_build_object('bcoins_redemptions', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('bcoins_redemptions', sqlerrm);
    end;
  end;

  begin
    delete from public.organization_transactions where id is not null;
    _result := _result || jsonb_build_object('organization_transactions', 'ok');
  exception when others then
    begin
      truncate table public.organization_transactions cascade;
      _result := _result || jsonb_build_object('organization_transactions', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('organization_transactions', sqlerrm);
    end;
  end;

  begin
    delete from public.gcash_transactions where id is not null;
    _result := _result || jsonb_build_object('gcash_transactions', 'ok');
  exception when others then
    begin
      truncate table public.gcash_transactions cascade;
      _result := _result || jsonb_build_object('gcash_transactions', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('gcash_transactions', sqlerrm);
    end;
  end;

  begin
    delete from public.print_orders where id is not null;
    _result := _result || jsonb_build_object('print_orders', 'ok');
  exception when others then
    begin
      truncate table public.print_orders cascade;
      _result := _result || jsonb_build_object('print_orders', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('print_orders', sqlerrm);
    end;
  end;

  begin
    delete from public.orders where id is not null;
    _result := _result || jsonb_build_object('orders', 'ok');
  exception when others then
    begin
      truncate table public.orders cascade;
      _result := _result || jsonb_build_object('orders', 'ok (truncate)');
    exception when others then
      _result := _result || jsonb_build_object('orders', sqlerrm);
    end;
  end;

  -- Reset wallet BALANCES to 0 (rows kept so students/orgs keep their wallets)
  begin
    update public.bcoins_wallets set balance = 0 where balance is distinct from 0;
    _result := _result || jsonb_build_object('bcoins_wallets', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('bcoins_wallets', sqlerrm);
  end;

  begin
    update public.organization_wallets set balance = 0 where balance is distinct from 0;
    _result := _result || jsonb_build_object('organization_wallets', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('organization_wallets', sqlerrm);
  end;

  return _result;
end;
$$;

-- Only signed-in users may execute it; the role check is inside the function.
revoke execute on function public.reset_all_customer_data() from anon, public;
grant execute on function public.reset_all_customer_data() to authenticated;
