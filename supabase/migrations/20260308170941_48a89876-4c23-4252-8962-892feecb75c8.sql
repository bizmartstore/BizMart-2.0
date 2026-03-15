
CREATE TABLE public.print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text,
  total_pages integer NOT NULL DEFAULT 0,
  bw_pages integer NOT NULL DEFAULT 0,
  colored_pages integer NOT NULL DEFAULT 0,
  page_size text NOT NULL DEFAULT 'short',
  cost numeric NOT NULL DEFAULT 0,
  maintenance_fee numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own print orders" ON public.print_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own print orders" ON public.print_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage print orders" ON public.print_orders
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));
