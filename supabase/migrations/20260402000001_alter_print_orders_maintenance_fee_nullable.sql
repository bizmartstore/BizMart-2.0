-- Make maintenance_fee nullable to allow NULL values during order creation
ALTER TABLE public.print_orders ALTER COLUMN maintenance_fee DROP NOT NULL;