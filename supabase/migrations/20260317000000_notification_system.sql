-- Table to store all notification history
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null for broadcast/admin-wide
    target_role TEXT, -- 'admin', 'seller', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT, -- Emoji or icon name
    link TEXT, -- Deep link URL (e.g., /orders/123)
    type TEXT NOT NULL, -- 'order_status', 'new_message', 'job_update', etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE notification_logs;

-- RLS Policies
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications or broadcast ones
CREATE POLICY "Users can view own notifications" ON public.notification_logs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND target_role IS NULL) OR
        (target_role = 'admin' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')))
    );

-- Only service role or specific functions can insert (handled via Edge Functions/Server logic)
CREATE POLICY "System can insert notifications" ON public.notification_logs
    FOR INSERT WITH CHECK (true);