-- Create reports table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' NOT NULL,
  severity TEXT DEFAULT 'Low' NOT NULL,
  is_anonymous BOOLEAN DEFAULT true NOT NULL,
  location TEXT,
  date_time TIMESTAMPTZ,
  people_involved TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report_updates table
CREATE TABLE public.report_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create evidence_files table
CREATE TABLE public.evidence_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create e_support_roles function for guidance role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Enable RLS on all tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can only view their own reports
CREATE POLICY "students_view_own_reports" ON public.reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'customer'
  ) AND (user_id = auth.uid() OR is_anonymous = true)
);

-- RLS Policy: Guidance staff can view all reports
CREATE POLICY "guidance_view_all_reports" ON public.reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'guidance'
  )
);

-- RLS Policy: Students can insert reports (anonymous or identified)
CREATE POLICY "students_insert_reports" ON public.reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'customer'
  )
);

-- RLS Policy: Guidance staff can update report status
CREATE POLICY "guidance_update_reports" ON public.reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'guidance'
  )
);

-- RLS Policy: Students can view their own report updates
CREATE POLICY "students_view_own_updates" ON public.report_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'customer'
  ) AND (
    EXISTS (SELECT 1 FROM public.reports WHERE reports.id = report_updates.report_id AND (reports.user_id = auth.uid() OR reports.is_anonymous = true))
  )
);

-- RLS Policy: Guidance staff can view all report updates
CREATE POLICY "guidance_view_all_updates" ON public.report_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'guidance'
  )
);

-- RLS Policy: Students can view their own evidence files
CREATE POLICY "students_view_own_evidence" ON public.evidence_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'customer'
  ) AND (
    EXISTS (SELECT 1 FROM public.reports WHERE reports.id = evidence_files.report_id AND (reports.user_id = auth.uid() OR reports.is_anonymous = true))
  )
);

-- RLS Policy: Guidance staff can view all evidence files
CREATE POLICY "guidance_view_all_evidence" ON public.evidence_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'guidance'
  )
);

-- RLS Policy: Students can insert evidence files for their reports
CREATE POLICY "students_insert_evidence" ON public.evidence_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'customer'
  ) AND (
    EXISTS (SELECT 1 FROM public.reports WHERE reports.id = evidence_files.report_id AND reports.user_id = auth.uid())
  )
);

-- RLS Policy: Guidance staff can insert evidence files
CREATE POLICY "guidance_insert_evidence" ON public.evidence_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'guidance'
  )
);

-- Create index for faster report lookups
CREATE INDEX idx_reports_tracking_id ON public.reports(tracking_id);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_type ON public.reports(type);
CREATE INDEX idx_report_updates_report_id ON public.report_updates(report_id);
CREATE INDEX idx_evidence_files_report_id ON public.evidence_files(report_id);