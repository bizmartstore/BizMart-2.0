-- Create daily_login_claims table for tracking daily login rewards
CREATE TABLE IF NOT EXISTS daily_login_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  bcoins_earned NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, claim_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_login_claims_user_date ON daily_login_claims(user_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_daily_login_claims_date ON daily_login_claims(claim_date);

-- Enable Row Level Security
ALTER TABLE daily_login_claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ensures idempotent re-runs)
DROP POLICY IF EXISTS "Users can view own claims" ON daily_login_claims;
DROP POLICY IF EXISTS "Users can insert own claims" ON daily_login_claims;
DROP POLICY IF EXISTS "Users can update own claims" ON daily_login_claims;

-- Policy: Users can only see their own claims
CREATE POLICY "Users can view own claims" ON daily_login_claims
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own claims
CREATE POLICY "Users can insert own claims" ON daily_login_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own claims (for corrections if needed)
CREATE POLICY "Users can update own claims" ON daily_login_claims
  FOR UPDATE USING (auth.uid() = user_id);