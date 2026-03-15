
-- Seller profiles table
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  store_name text NOT NULL DEFAULT '',
  store_description text DEFAULT '',
  store_image text DEFAULT '',
  store_saying text DEFAULT '',
  location text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sellers" ON public.seller_profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can update own profile" ON public.seller_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can insert own profile" ON public.seller_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage seller profiles" ON public.seller_profiles
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Seller applications (in-app questionnaire)
CREATE TABLE public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  reason text NOT NULL DEFAULT '',
  business_type text NOT NULL DEFAULT '',
  products_to_sell text NOT NULL DEFAULT '',
  experience text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON public.seller_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON public.seller_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage applications" ON public.seller_applications
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Seller codes (admin generates for approved sellers)
CREATE TABLE public.seller_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read unused seller codes" ON public.seller_codes
  FOR SELECT TO authenticated
  USING (is_used = false OR used_by = auth.uid());

CREATE POLICY "Users can claim seller codes" ON public.seller_codes
  FOR UPDATE TO authenticated
  USING (is_used = false)
  WITH CHECK (used_by = auth.uid() AND is_used = true);

CREATE POLICY "Admins can manage seller codes" ON public.seller_codes
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Add membership_type to club_memberships
ALTER TABLE public.club_memberships ADD COLUMN IF NOT EXISTS membership_type text NOT NULL DEFAULT 'standard';
