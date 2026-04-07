-- Create table for storing FCM tokens
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'seller', 'admin', 'member_admin', 'main_admin')),
  fcm_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fcm_token)
);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_fcm_token ON user_push_tokens(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_role ON user_push_tokens(role);

-- Enable RLS
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own token
CREATE POLICY "Users can view own token" ON user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own token
CREATE POLICY "Users can insert own token" ON user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own token
CREATE POLICY "Users can update own token" ON user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own token
CREATE POLICY "Users can delete own token" ON user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Function to clean up old tokens (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  -- Delete tokens older than 90 days
  DELETE FROM user_push_tokens 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;