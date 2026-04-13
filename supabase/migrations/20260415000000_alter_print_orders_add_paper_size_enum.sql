-- Add paper size enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_size_type') THEN
    CREATE TYPE paper_size_type AS ENUM ('short', 'a4', 'long');
  END IF;
END $$;

-- Alter the page_size column to use the enum type
ALTER TABLE print_orders
ALTER COLUMN page_size TYPE paper_size_type
USING page_size::paper_size_type;