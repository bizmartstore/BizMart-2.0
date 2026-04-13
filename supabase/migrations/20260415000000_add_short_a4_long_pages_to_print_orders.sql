-- Add columns for tracking pages by size
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS short_pages INTEGER DEFAULT 0;
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS a4_pages INTEGER DEFAULT 0;
ALTER TABLE print_orders ADD COLUMN IF NOT EXISTS long_pages INTEGER DEFAULT 0;

-- Update existing rows to set default values
UPDATE print_orders SET short_pages = 0, a4_pages = 0, long_pages = 0 WHERE true;

-- Create trigger to update these columns when print order is created or updated
CREATE OR REPLACE FUNCTION update_print_order_page_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- This function will be called by the application logic
  -- We're just creating it here for future use
  RETURN NEW;
END;
$$;