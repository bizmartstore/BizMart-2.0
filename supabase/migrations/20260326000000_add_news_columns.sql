-- Add missing columns to news_updates table
-- This migration ensures the news_updates table has all required columns for the admin NewsTab

-- Add image_url column if it doesn't exist
ALTER TABLE public.news_updates 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add images column if it doesn't exist (for multiple images)
ALTER TABLE public.news_updates 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add is_active column if it doesn't exist
ALTER TABLE public.news_updates 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add created_at column if it doesn't exist
ALTER TABLE public.news_updates 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at column if it doesn't exist
ALTER TABLE public.news_updates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS if not already enabled (optional, but recommended)
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for news images if it doesn't exist (will be created automatically on first upload)
-- This is just a note: the bucket name is "news-images" based on the code