-- Atomic stock deduction + approval for product orders
CREATE OR REPLACE FUNCTION public.approve_order_with_stock(_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_product_id text;
  v_qty integer;
  v_stock integer;
  v_sold integer;
  v_total numeric;
  v_admin_commission numeric;
  v_member_admin_commission numeric;
  v_seller_earnings numeric;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to approve orders';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be approved';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_order.items, '[]'::jsonb)) LOOP
    v_product_id := v_item->>'id';
    v_qty := COALESCE((v_item->>'quantity')::integer, 0);

    IF v_product_id IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;

    SELECT stock, COALESCE(sold, 0)
    INTO v_stock, v_sold
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product % (remaining: %, required: %)', v_product_id, v_stock, v_qty;
    END IF;

    UPDATE public.products
    SET
      stock = v_stock - v_qty,
      sold = v_sold + v_qty
    WHERE id = v_product_id;
  END LOOP;

  v_total := GREATEST(0, COALESCE(v_order.total, 0) - COALESCE(v_order.delivery_fee, 0));
  v_admin_commission := ROUND((v_total * 0.10)::numeric, 2);
  v_member_admin_commission := ROUND((v_total * 0.10)::numeric, 2);
  v_seller_earnings := ROUND((v_total - v_admin_commission - v_member_admin_commission)::numeric, 2);

  UPDATE public.orders
  SET
    status = 'approved',
    updated_at = now(),
    admin_commission = v_admin_commission,
    member_admin_commission = v_member_admin_commission,
    seller_earnings = v_seller_earnings
  WHERE id = _order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- Shared helper: write live shoutout rows
CREATE OR REPLACE FUNCTION public.emit_live_shoutout(
  p_title text,
  p_message text,
  p_icon text DEFAULT '📣',
  p_link text DEFAULT '/'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_logs (title, message, icon, link, type, target_role, target_user_id)
  VALUES (p_title, p_message, p_icon, p_link, 'live_shoutout', NULL, NULL);
END;
$$;

-- Profile signup shoutout
CREATE OR REPLACE FUNCTION public.shoutout_on_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := NULLIF(TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, ''))), '');
  v_name := COALESCE(v_name, SPLIT_PART(COALESCE(NEW.email, 'New User'), '@', 1), 'New User');

  PERFORM public.emit_live_shoutout(
    '🎉 New Student Joined',
    FORMAT('%s just registered in BizMart!', v_name),
    '🎉',
    '/'
  );

  RETURN NEW;
END;
$$;

-- Club membership shoutout
CREATE OR REPLACE FUNCTION public.shoutout_on_membership_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), '')
  INTO v_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  v_name := COALESCE(v_name, 'A student');

  PERFORM public.emit_live_shoutout(
    '👑 New Club Member',
    FORMAT('%s successfully became a BizMart Club member!', v_name),
    '👑',
    '/club'
  );

  RETURN NEW;
END;
$$;

-- Approved purchase shoutout
CREATE OR REPLACE FUNCTION public.shoutout_on_order_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status, '') <> 'approved' THEN
    v_name := COALESCE(NULLIF(TRIM(COALESCE(NEW.customer_name, '')), ''), 'A customer');

    PERFORM public.emit_live_shoutout(
      '🛒 Purchase Approved',
      FORMAT('%s completed a successful purchase worth ₱%s!', v_name, TO_CHAR(COALESCE(NEW.total, 0), 'FM999999990.00')),
      '🛒',
      '/orders'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- New print request shoutout
CREATE OR REPLACE FUNCTION public.shoutout_on_print_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  SELECT NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), '')
  INTO v_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  v_name := COALESCE(v_name, 'A student');

  PERFORM public.emit_live_shoutout(
    '🖨️ New Print Request',
    FORMAT('%s submitted a print request: %s', v_name, COALESCE(NEW.file_name, 'Document')),
    '🖨️',
    '/orders'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shoutout_profile_insert ON public.profiles;
CREATE TRIGGER trg_shoutout_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_profile_insert();

DROP TRIGGER IF EXISTS trg_shoutout_membership_insert ON public.club_memberships;
CREATE TRIGGER trg_shoutout_membership_insert
AFTER INSERT ON public.club_memberships
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_membership_insert();

DROP TRIGGER IF EXISTS trg_shoutout_order_approved ON public.orders;
CREATE TRIGGER trg_shoutout_order_approved
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_order_approved();

DROP TRIGGER IF EXISTS trg_shoutout_print_insert ON public.print_orders;
CREATE TRIGGER trg_shoutout_print_insert
AFTER INSERT ON public.print_orders
FOR EACH ROW
EXECUTE FUNCTION public.shoutout_on_print_insert();