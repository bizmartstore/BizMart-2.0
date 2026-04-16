-- Create registration_codes table for organization registration
CREATE TABLE IF NOT EXISTS registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_registration_codes_used ON registration_codes(used);
CREATE INDEX IF NOT EXISTS idx_registration_codes_created_at ON registration_codes(created_at);
