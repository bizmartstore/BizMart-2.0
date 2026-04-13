-- Create support_reports table
CREATE TABLE public.support_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  date DATE,
  time TIME WITHOUT TIME ZONE,
  is_anonymous BOOLEAN DEFAULT false,
  reporter_name TEXT,
  reporter_contact TEXT,
  status TEXT DEFAULT 'pending',
  tracking_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_notes TEXT,
  severity TEXT DEFAULT 'medium',
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
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

CREATE POLICY "Admins can update all reports" ON public.support_reports
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_reports_tracking_id ON public.support_reports(tracking_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_user_id ON public.support_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_status ON public.support_reports(status);