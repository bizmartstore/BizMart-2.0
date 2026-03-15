
-- BCoins wallets table
CREATE TABLE public.bcoins_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bcoins_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.bcoins_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.bcoins_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.bcoins_wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage wallets" ON public.bcoins_wallets FOR ALL USING (is_admin(auth.uid()));

-- BCoins transactions table
CREATE TABLE public.bcoins_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL, -- 'earn_purchase', 'earn_gcash', 'redeem_gcash'
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bcoins_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bcoins txns" ON public.bcoins_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bcoins txns" ON public.bcoins_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage bcoins txns" ON public.bcoins_transactions FOR ALL USING (is_admin(auth.uid()));

-- BCoins redemptions table
CREATE TABLE public.bcoins_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bcoins_amount numeric NOT NULL,
  gcash_amount integer NOT NULL,
  gcash_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bcoins_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.bcoins_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.bcoins_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage redemptions" ON public.bcoins_redemptions FOR ALL USING (is_admin(auth.uid()));

-- Enable realtime on club_codes and bcoins tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bcoins_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bcoins_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bcoins_redemptions;

-- Insert bcoins_pool setting into app_settings if not exists
INSERT INTO public.app_settings (key, value) VALUES ('bcoins_pool', '{"current": 0, "max": 5000}') ON CONFLICT DO NOTHING;
