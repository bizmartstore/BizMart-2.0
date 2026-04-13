-- Create support_reports table
CREATE TABLE public.support_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  date DATE,
  time TIME,
  is_anonymous BOOLEAN DEFAULT false,
  reporter_name TEXT,
  reporter_contact TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  tracking_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  severity TEXT DEFAULT 'medium' NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation
CREATE POLICY "Users can view their own reports" ON public.support_reports
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON public.support_reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.support_reports
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" ON public.support_reports
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

CREATE POLICY "Admins can update all reports" ON public.support_reports
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

CREATE POLICY "Service role can insert reports" ON public.support_reports
FOR INSERT TO authenticated USING (auth.role() = 'service_role'::text);

CREATE POLICY "No deletes" ON public.support_reports
FOR DELETE TO authenticated USING (false);