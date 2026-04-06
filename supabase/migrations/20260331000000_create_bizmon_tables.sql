-- Create bizmon_pets table
CREATE TABLE IF NOT EXISTS bizmon_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 100,
  happiness INTEGER DEFAULT 100,
  last_fed TIMESTAMPTZ,
  last_trained TIMESTAMPTZ,
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create bizmon_battles table for PvP
CREATE TABLE IF NOT EXISTS bizmon_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  defender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenger_pet_id UUID REFERENCES bizmon_pets(id),
  defender_pet_id UUID REFERENCES bizmon_pets(id),
  result TEXT CHECK (result IN ('win', 'lose', 'draw')),
  xp_gained INTEGER DEFAULT 0,
  bcoins_gained INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bizmon_daily_limits for rate limiting
CREATE TABLE IF NOT EXISTS bizmon_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  battles_played INTEGER DEFAULT 0,
  training_sessions INTEGER DEFAULT 0,
  bcoins_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE bizmon_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizmon_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bizmon_daily_limits ENABLE ROW LEVEL SECURITY;

-- Policies for pets
CREATE POLICY "Users can view own pet" ON bizmon_pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pet" ON bizmon_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pet" ON bizmon_pets FOR UPDATE USING (auth.uid() = user_id);

-- Policies for battles
CREATE POLICY "Users can view own battles" ON bizmon_battles FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = defender_id);
CREATE POLICY "Users can insert battles" ON bizmon_battles FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update own battles" ON bizmon_battles FOR UPDATE USING (auth.uid() = challenger_id);

-- Policies for daily limits
CREATE POLICY "Users can view own limits" ON bizmon_daily_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own limits" ON bizmon_daily_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own limits" ON bizmon_daily_limits FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bizmon_pets_user_id ON bizmon_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_bizmon_battles_challenger_id ON bizmon_battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_bizmon_battles_created_at ON bizmon_battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bizmon_daily_limits_user_date ON bizmon_daily_limits(user_id, date);