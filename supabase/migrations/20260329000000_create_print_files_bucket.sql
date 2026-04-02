-- Create print-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('print-files', 'print-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (so users can view their uploaded files)
CREATE POLICY "Allow public read access on print-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'print-files');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload print files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'print-files');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own print files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'print-files' AND auth.uid()::text = (storage.foldername(name))[1]);