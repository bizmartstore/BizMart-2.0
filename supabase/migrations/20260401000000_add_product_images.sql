-- Add images column to products table (JSON array for up to 3 images)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Backfill existing products: move single image to images array
UPDATE products 
SET images = jsonb_build_array(image) 
WHERE image IS NOT NULL AND image != '' AND (images IS NULL OR images = '[]'::jsonb);