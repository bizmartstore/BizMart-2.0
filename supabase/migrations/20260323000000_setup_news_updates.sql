-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.news_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Everyone can view active news
CREATE POLICY "Anyone can view active news" 
ON public.news_updates FOR SELECT 
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage news" 
ON public.news_updates FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'member_admin')
  )
);

-- 4. Add a helper to handle the 'images' column if it was missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news_updates' AND column_name='images') THEN
        ALTER TABLE public.news_updates ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;