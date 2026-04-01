-- Ensure club_memberships table exists and has all required columns
CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  control_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  membership_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  membership_type TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns if they don't exist (safe for existing tables)
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS control_number TEXT;
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS membership_date TIMESTAMPTZ;
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'standard';
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_control_number ON club_memberships(control_number);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);

-- RLS Policies
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
  ON club_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships"
  ON club_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships"
  ON club_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('main_admin', 'member_admin')
    )
  );