
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_section text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_grade_level text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_contact text;
