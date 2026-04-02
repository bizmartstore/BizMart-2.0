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

-- Enable RLS
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to perform all operations on news_updates
-- This uses the get_user_role function to check if the user is an admin
CREATE POLICY "Admins can manage news" ON public.news_updates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'member_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'member_admin')
  )
);

-- Create policy to allow public read access to active news only
CREATE POLICY "Public can view active news" ON public.news_updates
FOR SELECT
USING (is_active = true);

-- Optional: Allow service role to bypass RLS (already bypasses by default, but explicit)
-- This is just for documentation - service role automatically bypasses RLS