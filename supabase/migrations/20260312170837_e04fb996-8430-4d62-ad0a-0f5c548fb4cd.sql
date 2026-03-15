-- Create seller-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('seller-images', 'seller-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view seller images
CREATE POLICY "Anyone can view seller images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'seller-images');

-- Authenticated users can upload seller images
CREATE POLICY "Authenticated can upload seller images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'seller-images');

-- Authenticated users can delete their seller images
CREATE POLICY "Authenticated can delete seller images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'seller-images');

-- Allow authenticated users to read admin/member_admin roles (so they can find admin contacts for messaging)
CREATE POLICY "Anyone can read admin roles" ON public.user_roles FOR SELECT TO authenticated USING (
  role IN ('main_admin', 'member_admin')
);