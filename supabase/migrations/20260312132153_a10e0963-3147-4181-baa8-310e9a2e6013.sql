ALTER TABLE public.print_orders
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_date text,
  ADD COLUMN IF NOT EXISTS pickup_time text;