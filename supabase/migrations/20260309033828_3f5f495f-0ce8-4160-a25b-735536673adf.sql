-- Drop ALL existing restrictive policies on notification_logs
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can read all notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notification_logs;

-- Recreate as PERMISSIVE (default) so they OR together
CREATE POLICY "Admins full access notifications"
ON public.notification_logs FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can read own notifications"
ON public.notification_logs FOR SELECT TO authenticated
USING (
  (auth.uid() = target_user_id)
  OR (target_user_id IS NULL AND target_role IS NULL)
);

CREATE POLICY "Admins can read admin-targeted notifications"
ON public.notification_logs FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert notifications"
ON public.notification_logs FOR INSERT TO authenticated
WITH CHECK (true);