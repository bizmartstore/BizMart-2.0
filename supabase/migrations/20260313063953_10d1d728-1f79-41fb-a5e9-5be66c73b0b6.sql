
-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS trg_shoutout_profile_insert ON public.profiles;
DROP TRIGGER IF EXISTS trg_shoutout_order_approved ON public.orders;
DROP TRIGGER IF EXISTS trg_shoutout_print_insert ON public.print_orders;
DROP TRIGGER IF EXISTS trg_shoutout_membership_insert ON public.club_memberships;
DROP TRIGGER IF EXISTS trg_shoutout_order_insert ON public.orders;

-- 1. New student registration
CREATE TRIGGER trg_shoutout_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_profile_insert();

-- 2. Order approved
CREATE TRIGGER trg_shoutout_order_approved
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_order_approved();

-- 3. New print request
CREATE TRIGGER trg_shoutout_print_insert
AFTER INSERT ON public.print_orders
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_print_insert();

-- 4. New club membership
CREATE TRIGGER trg_shoutout_membership_insert
AFTER INSERT ON public.club_memberships
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_membership_insert();

-- 5. New purchase order shoutout
CREATE OR REPLACE FUNCTION public.shoutout_on_order_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(NULLIF(TRIM(COALESCE(NEW.customer_name, '')), ''), 'A customer');
  PERFORM public.emit_live_shoutout(
    '🛒 New Order Placed',
    FORMAT('%s placed an order worth ₱%s!', v_name, TO_CHAR(COALESCE(NEW.total, 0), 'FM999999990.00')),
    '🛒',
    '/orders'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shoutout_order_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_order_insert();
