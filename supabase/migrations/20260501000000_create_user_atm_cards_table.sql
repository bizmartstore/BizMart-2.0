-- Create user_atm_cards table
CREATE TABLE user_atm_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number VARCHAR(19) UNIQUE, -- masked: 1234 5678 9012 3456
  card_holder_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  bcoins_wallet_id UUID REFERENCES bcoins_wallets(id) ON DELETE CASCADE
);

-- Create RLS policy for user_atm_cards
CREATE POLICY "Users can view their own ATM cards"
ON user_atm_cards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ATM cards"
ON user_atm_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ATM cards"
ON user_atm_cards
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ATM cards"
ON user_atm_cards
FOR DELETE
USING (auth.uid() = user_id);