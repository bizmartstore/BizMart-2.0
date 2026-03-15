
-- POS Sales table for tracking point-of-sale transactions
CREATE TABLE public.pos_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_type TEXT NOT NULL DEFAULT 'product', -- 'product' or 'print'
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  main_admin_commission NUMERIC NOT NULL DEFAULT 0,
  member_admin_earnings NUMERIC NOT NULL DEFAULT 0,
  seller_earnings NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  sold_by UUID NOT NULL,
  customer_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

-- Admins can manage all POS sales
CREATE POLICY "Admins can manage pos sales"
  ON public.pos_sales
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Enable realtime for POS sales
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_sales;
