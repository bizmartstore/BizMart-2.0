-- 1. Create news_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.news_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for news_updates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news_updates' AND policyname = 'Public can view active news') THEN
        CREATE POLICY "Public can view active news" ON public.news_updates FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news_updates' AND policyname = 'Admins can do everything') THEN
        CREATE POLICY "Admins can do everything" ON public.news_updates FOR ALL USING (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin'))
        );
    END IF;
END $$;

-- 4. Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies for news-images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'news-images' AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin'))
);
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'news-images' AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin'))
);