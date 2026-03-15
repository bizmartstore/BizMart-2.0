
CREATE TABLE public.news_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active news" ON public.news_updates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert news" ON public.news_updates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'main_admin') OR public.has_role(auth.uid(), 'member_admin'));

CREATE POLICY "Admins can update news" ON public.news_updates
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'main_admin') OR public.has_role(auth.uid(), 'member_admin'));

CREATE POLICY "Admins can delete news" ON public.news_updates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'main_admin') OR public.has_role(auth.uid(), 'member_admin'));
