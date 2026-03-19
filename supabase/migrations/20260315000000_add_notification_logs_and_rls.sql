-- 1. Ensure the table exists with correct columns
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    target_role TEXT, 
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    icon TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_logs;

-- Recreate Policies
CREATE POLICY "Users can view own notifications" 
ON public.notification_logs FOR SELECT 
USING (auth.uid() = user_id OR target_role IS NOT NULL);

CREATE POLICY "Users can insert notifications" 
ON public.notification_logs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own notifications" 
ON public.notification_logs FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;

-- 4. Fix Foreign Keys for Joins (Resolves 400 errors)
-- Ensure print_orders has a clear relationship to profiles
ALTER TABLE public.print_orders DROP CONSTRAINT IF EXISTS print_orders_user_id_fkey,
ADD CONSTRAINT print_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Ensure job_postings has a clear relationship to profiles
ALTER TABLE public.job_postings 
DROP CONSTRAINT IF EXISTS job_postings_client_id_fkey,
ADD CONSTRAINT job_postings_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.profiles(user_id);

-- This ensures Supabase knows exactly how to join freelancer_profiles to profiles
ALTER TABLE public.freelancer_profiles 
DROP CONSTRAINT IF EXISTS freelancer_profiles_user_id_fkey,
ADD CONSTRAINT freelancer_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);