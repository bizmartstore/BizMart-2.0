-- Fix: Allow any authenticated user to insert notification logs
DROP POLICY IF EXISTS "Authenticated users can insert own notifications" ON public.notification_logs;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix: Allow users to also see notifications where target_user_id is null (broadcast)
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notification_logs;
CREATE POLICY "Users can read own notifications"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = target_user_id
    OR (target_user_id IS NULL AND target_role IS NULL)
  );