
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  icon text DEFAULT '🔔',
  link text DEFAULT '/',
  target_role text DEFAULT NULL,
  target_user_id uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all notifications" ON public.notification_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage notifications" ON public.notification_logs
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can read own notifications" ON public.notification_logs
  FOR SELECT TO authenticated USING (auth.uid() = target_user_id);

CREATE POLICY "Anyone authenticated can insert" ON public.notification_logs
  FOR INSERT TO authenticated WITH CHECK (true);
