-- Create a function to update sold counts
CREATE OR REPLACE FUNCTION update_product_sold_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  item_record JSONB;
  product_id TEXT;
  quantity INTEGER;
BEGIN
  -- Only process completed orders
  IF NEW.status = 'completed' THEN
    -- Process each item in the order
    FOR item_record IN SELECT json_array_elements(NEW.items::json) LOOP
      product_id := item_record->>'id';
      quantity := (item_record->>'quantity')::INTEGER;

      -- Update the product's sold count
      UPDATE products
      SET sold = sold + quantity
      WHERE id = product_id;

      -- Also update flash sale products if applicable
      UPDATE products
      SET sold = sold + quantity
      WHERE id = product_id AND is_flash_sale = true;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for orders table
DROP TRIGGER IF EXISTS update_sold_counts_on_order_completed ON orders;
CREATE TRIGGER update_sold_counts_on_order_completed
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
EXECUTE FUNCTION update_product_sold_counts();

-- Create trigger for insert (in case order is created as completed)
DROP TRIGGER IF EXISTS update_sold_counts_on_order_created ON orders;
CREATE TRIGGER update_sold_counts_on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_product_sold_counts();