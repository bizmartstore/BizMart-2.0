-- Drop the broken restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can read all notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notification_logs;

-- Recreate as PERMISSIVE (default) so they OR together
CREATE POLICY "Admins can read all notifications"
ON public.notification_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can read own notifications"
ON public.notification_logs
FOR SELECT
TO authenticated
USING (
  (auth.uid() = target_user_id)
  OR (target_user_id IS NULL AND target_role IS NULL)
);