-- Create scheduled_broadcasts table
CREATE TABLE public.scheduled_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT '📢',
  link TEXT DEFAULT '/',
  schedule_time TIME WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.scheduled_broadcasts ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation needed
CREATE POLICY "scheduled_broadcasts_select_policy" ON public.scheduled_broadcasts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "scheduled_broadcasts_insert_policy" ON public.scheduled_broadcasts
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "scheduled_broadcasts_update_policy" ON public.scheduled_broadcasts
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "scheduled_broadcasts_delete_policy" ON public.scheduled_broadcasts
FOR DELETE TO authenticated USING (true);

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_scheduled_broadcasts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for scheduled_broadcasts
DROP TRIGGER IF EXISTS on_scheduled_broadcasts_updated ON public.scheduled_broadcasts;
CREATE TRIGGER on_scheduled_broadcasts_updated
  BEFORE UPDATE ON public.scheduled_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.update_scheduled_broadcasts_updated_at();