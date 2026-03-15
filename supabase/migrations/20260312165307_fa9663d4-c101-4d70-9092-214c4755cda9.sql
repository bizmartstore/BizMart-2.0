
-- Add images column (jsonb array of URLs) to news_updates
ALTER TABLE public.news_updates ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Create news-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read news images
CREATE POLICY "Anyone can view news images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'news-images');

-- Allow admins to upload news images
CREATE POLICY "Admins can upload news images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news-images' AND public.is_admin(auth.uid()));

-- Allow admins to delete news images
CREATE POLICY "Admins can delete news images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'news-images' AND public.is_admin(auth.uid()));
