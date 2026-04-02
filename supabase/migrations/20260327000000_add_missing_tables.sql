-- Fix missing tables for admin dashboard

-- 1. Create seller_applications table
CREATE TABLE IF NOT EXISTS seller_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  products_to_sell TEXT NOT NULL,
  reason TEXT NOT NULL,
  experience TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;

-- Policies for seller_applications
CREATE POLICY "Users can view own applications" ON seller_applications
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all applications" ON seller_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

CREATE POLICY "Admins can update applications" ON seller_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

-- 2. Create club_memberships table (if not exists)
CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  control_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  membership_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  membership_type TEXT DEFAULT 'standard' CHECK (membership_type IN ('standard', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

-- Policies for club_memberships
CREATE POLICY "Users can view own membership" ON club_memberships
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all memberships" ON club_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

CREATE POLICY "Admins can update memberships" ON club_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

-- 3. Create bcoins_redemptions table
CREATE TABLE IF NOT EXISTS bcoins_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bcoins_amount NUMERIC NOT NULL,
  gcash_amount NUMERIC NOT NULL,
  gcash_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bcoins_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for bcoins_redemptions
CREATE POLICY "Users can view own redemptions" ON bcoins_redemptions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Admins can view all redemptions" ON bcoins_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

CREATE POLICY "Admins can update redemptions" ON bcoins_redemptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

-- 4. Fix the club_memberships foreign key relationship with profiles if needed
-- The error 400 might be due to missing relationship. Let's ensure the relationship exists:
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'club_memberships_user_id_fkey'
    AND table_name = 'club_memberships'
  ) THEN
    ALTER TABLE club_memberships 
    ADD CONSTRAINT club_memberships_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);
CREATE INDEX IF NOT EXISTS idx_bcoins_redemptions_user_id ON bcoins_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_bcoins_redemptions_status ON bcoins_redemptions(status);

-- 6. Insert some default club membership codes if none exist
INSERT INTO club_codes (code, is_used) 
SELECT 'BIZCLUB2026', false 
WHERE NOT EXISTS (SELECT 1 FROM club_codes WHERE code = 'BIZCLUB2026');

INSERT INTO club_codes (code, is_used) 
SELECT 'BIZCLUB2026VIP', false 
WHERE NOT EXISTS (SELECT 1 FROM club_codes WHERE code = 'BIZCLUB2026VIP');