-- Ensure the images column exists and is of type text[]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images TEXT[];
  END IF;
END $$;