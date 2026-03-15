
-- Club codes table (admin creates codes for students)
CREATE TABLE public.club_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.club_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read unused codes" ON public.club_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update codes" ON public.club_codes FOR UPDATE TO authenticated USING (true);

-- Club memberships table
CREATE TABLE public.club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  control_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  membership_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own membership" ON public.club_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own membership" ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- GCash transactions table
CREATE TABLE public.gcash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash_in', 'cash_out')),
  amount INTEGER NOT NULL,
  service_fee INTEGER NOT NULL DEFAULT 10,
  total INTEGER NOT NULL,
  gcash_number TEXT NOT NULL,
  admin_gcash_number TEXT NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gcash_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.gcash_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.gcash_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
