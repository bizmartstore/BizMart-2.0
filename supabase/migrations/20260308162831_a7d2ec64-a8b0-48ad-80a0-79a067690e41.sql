
DROP POLICY "Anyone authenticated can insert" ON public.notification_logs;
CREATE POLICY "Authenticated users can insert own notifications" ON public.notification_logs
  FOR INSERT TO authenticated WITH CHECK (target_user_id = auth.uid() OR public.is_admin(auth.uid()));
