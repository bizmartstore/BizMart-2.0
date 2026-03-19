-- ============================================
-- 1. ENSURE notification_logs TABLE EXISTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role TEXT, -- 'admin', 'seller', 'member_admin', 'main_admin'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    icon TEXT DEFAULT '🔔',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. FIX RLS POLICIES FOR notification_logs
-- ============================================
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notification_logs;

-- Policy: Users can see their own notifications OR notifications targeted at their role
CREATE POLICY "Users can view own notifications" 
ON public.notification_logs FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (target_role IS NOT NULL AND (
    target_role = 'admin' AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')
    )
  ))
);

-- Policy: Allow authenticated users to insert notifications (for system/backend)
CREATE POLICY "Users can insert notifications" 
ON public.notification_logs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notification_logs FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can view all notifications (for admin dashboard)
CREATE POLICY "Admins can view all notifications" 
ON public.notification_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')
  )
);

-- ============================================
-- 3. FIX FOREIGN KEY CONSTRAINTS
-- ============================================
-- print_orders to profiles
ALTER TABLE public.print_orders DROP CONSTRAINT IF EXISTS print_orders_user_id_fkey;
ALTER TABLE public.print_orders ADD CONSTRAINT print_orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- job_postings to profiles (client)
ALTER TABLE public.job_postings DROP CONSTRAINT IF EXISTS job_postings_client_id_fkey;
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- freelancer_profiles to profiles
ALTER TABLE public.freelancer_profiles DROP CONSTRAINT IF EXISTS freelancer_profiles_user_id_fkey;
ALTER TABLE public.freelancer_profiles ADD CONSTRAINT freelancer_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- ============================================
-- 4. ENABLE REALTIME FOR notification_logs
-- ============================================
-- First, check if already in publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables     WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'     AND tablename = 'notification_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;
  END IF;
END $$;

-- ============================================
-- 5. CREATE MISSING TABLES (if they don't exist)
-- ============================================-- user_roles table (for admin roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('main_admin', 'member_admin', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles - DROP IF EXISTS to avoid errors on re-application
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Allow service role to manage roles (for admin functions)
CREATE POLICY "Service role can manage roles" 
ON public.user_roles FOR ALL 
USING (auth.role() = 'service_role');

-- ============================================
-- 6. CREATE app_settings TABLE (if missing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" 
ON public.app_settings FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated users can read settings" 
ON public.app_settings FOR SELECT 
USING (auth.role() = 'authenticated');

-- ============================================
-- 7. INSERT DEFAULT app_settings
-- ============================================
INSERT INTO public.app_settings (key, value) 
VALUES 
  ('store_status', '{"is_open": true, "close_message": "Store is currently closed."}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) 
VALUES 
  ('gcash_service_fee', '{"amount": 10}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value) 
VALUES 
  ('flash_sale_state', '{"ends_at": null, "product_ids": []}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. GRANT PERMISSIONS FOR SERVICE ROLE
-- ============================================
-- This allows your Edge Functions to insert notifications
GRANT INSERT ON public.notification_logs TO service_role;
GRANT SELECT ON public.notification_logs TO service_role;
GRANT UPDATE ON public.notification_logs TO service_role;

-- Grant access to other tables for Edge FunctionsGRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;