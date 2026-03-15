
-- Create storage bucket for print files
INSERT INTO storage.buckets (id, name, public) VALUES ('print-files', 'print-files', false);

-- Allow authenticated users to upload their own print files
CREATE POLICY "Users can upload print files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'print-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own files
CREATE POLICY "Users can read own print files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'print-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins to read all print files
CREATE POLICY "Admins can read all print files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'print-files' AND public.is_admin(auth.uid()));

-- Allow admins to delete print files
CREATE POLICY "Admins can delete print files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'print-files' AND public.is_admin(auth.uid()));
