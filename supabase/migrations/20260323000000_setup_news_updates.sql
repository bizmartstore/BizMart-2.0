-- Drop the table and recreate it to ensure a clean state with proper UUIDs
DROP TABLE IF EXISTS public.news_updates;

CREATE TABLE public.news_updates (
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

-- Re-enable security
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active news" 
ON public.news_updates FOR SELECT 
USING (is_active = true);

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