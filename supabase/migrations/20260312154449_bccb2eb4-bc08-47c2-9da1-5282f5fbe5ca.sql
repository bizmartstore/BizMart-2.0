
CREATE OR REPLACE FUNCTION public.approve_order_with_stock(_order_id uuid)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
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

  -- Calculate commissions (no stock deduction yet - that happens on completion)
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
$function$;

-- New function: complete order and deduct stock (called when admin confirms/completes)
CREATE OR REPLACE FUNCTION public.complete_order_with_stock(_order_id uuid)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_product_id text;
  v_qty integer;
  v_stock integer;
  v_sold integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to complete orders';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved orders can be completed';
  END IF;

  -- Deduct stock for each item
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

  -- Mark as completed
  UPDATE public.orders
  SET
    status = 'completed',
    updated_at = now()
  WHERE id = _order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$function$;
