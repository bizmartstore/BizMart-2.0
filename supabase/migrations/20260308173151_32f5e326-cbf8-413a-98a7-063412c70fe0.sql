
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_date text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_time text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_commission numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_earnings numeric NOT NULL DEFAULT 0;
