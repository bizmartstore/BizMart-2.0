-- ============================================================
-- Reset All Customer Data (Main Admin only)
-- ============================================================
-- WHAT THIS CLEARS (customer/transaction data):
--   - orders                      (customer orders, incl. seller earnings rows)
--   - print_orders                (printing service orders)
--   - gcash_transactions          (GCash in / out cash-in records)
--   - organization_transactions   (org GCash / money in / out)
--   - bcoins_transactions         (BizCoin earn/spend history)
--   - bcoins_redemptions          (BizCoin redemption requests)
--   - payment_references          (payment proof/reference uploads)
--   - bcoins_wallets.balance -> 0 (student wallet balances reset)
--   - organization_wallets.balance -> 0 (org wallet balances reset)
--
-- WHAT THIS PRESERVES (untouched):
--   - banners, products (items), categories, users/profiles, auth accounts,
--     user_roles, club codes, seller codes, club memberships, seller
--     applications/profiles, organizations, org members/events/announcements,
--     chat (conversations/messages), support reports, app settings,
--     registration codes.
--
-- Run ONCE in the Supabase SQL Editor (it creates the function).
-- Afterwards, the Settings tab in the admin dashboard can trigger it.
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

  -- --------------------------------------------------------
  -- Delete dependent / transactional data first, then orders
  -- --------------------------------------------------------

  begin
    delete from public.payment_references;
    _result := _result || jsonb_build_object('payment_references', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('payment_references', sqlerrm);
  end;

  begin
    delete from public.bcoins_transactions;
    _result := _result || jsonb_build_object('bcoins_transactions', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('bcoins_transactions', sqlerrm);
  end;

  begin
    delete from public.bcoins_redemptions;
    _result := _result || jsonb_build_object('bcoins_redemptions', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('bcoins_redemptions', sqlerrm);
  end;

  begin
    delete from public.organization_transactions;
    _result := _result || jsonb_build_object('organization_transactions', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('organization_transactions', sqlerrm);
  end;

  begin
    delete from public.gcash_transactions;
    _result := _result || jsonb_build_object('gcash_transactions', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('gcash_transactions', sqlerrm);
  end;

  begin
    delete from public.print_orders;
    _result := _result || jsonb_build_object('print_orders', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('print_orders', sqlerrm);
  end;

  begin
    delete from public.orders;
    _result := _result || jsonb_build_object('orders', 'ok');
  exception when others then
    _result := _result || jsonb_build_object('orders', sqlerrm);
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
