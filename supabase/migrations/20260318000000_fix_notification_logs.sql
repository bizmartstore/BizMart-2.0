-- 1. Add is_read column if it doesn't exist
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 2. Ensure RLS is enabled
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Users can update own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notification_logs;

-- 4. Create proper policies
CREATE POLICY "Users can view own notifications" ON notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notification_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notification_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON notification_logs FOR INSERT WITH CHECK (true);