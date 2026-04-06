-- Create storage bucket for support evidence if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-evidence', 'support-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload evidence
CREATE POLICY "Allow authenticated uploads to support-evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-evidence');

-- Allow public access to view evidence (restricted by RLS on the table level in practice)
CREATE POLICY "Allow public viewing of support-evidence"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support-evidence');