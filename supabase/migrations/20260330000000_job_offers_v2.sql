-- Job Offers System V2: Bidding, Escrow, Sessions, Reviews

-- 1. Update job_postings table
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS min_price NUMERIC DEFAULT 0;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS max_price NUMERIC;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC DEFAULT 0;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'medium';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'on_campus';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS approved_location TEXT;

-- 2. Create job_bids table
CREATE TABLE IF NOT EXISTS job_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  proposed_price NUMERIC NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create job_sessions table
CREATE TABLE IF NOT EXISTS job_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'disputed', 'cancelled')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  proof_urls TEXT[] DEFAULT '{}',
  proof_description TEXT,
  customer_review TEXT,
  freelancer_review TEXT,
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  freelancer_rating INTEGER CHECK (freelancer_rating BETWEEN 1 AND 5),
  escrow_released BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create escrow_transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  session_id UUID REFERENCES job_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'release_freelancer', 'release_maintenance', 'release_admin', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create job_disputes table
CREATE TABLE IF NOT EXISTS job_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES job_sessions(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE job_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_disputes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for job_bids
CREATE POLICY "Users can view bids on their jobs" ON job_bids FOR SELECT USING (
  job_id IN (SELECT id FROM job_postings WHERE client_id = auth.uid()) OR
  freelancer_id = auth.uid()
);
CREATE POLICY "Freelancers can create bids" ON job_bids FOR INSERT WITH CHECK (
  freelancer_id = auth.uid() AND
  EXISTS (SELECT 1 FROM freelancer_profiles WHERE user_id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Clients can update bids on their jobs" ON job_bids FOR UPDATE USING (
  job_id IN (SELECT id FROM job_postings WHERE client_id = auth.uid())
);

-- 8. RLS Policies for job_sessions
CREATE POLICY "Users can view their sessions" ON job_sessions FOR SELECT USING (
  customer_id = auth.uid() OR freelancer_id = auth.uid()
);
CREATE POLICY "Customers can update their sessions" ON job_sessions FOR UPDATE USING (
  customer_id = auth.uid()
);
CREATE POLICY "Freelancers can update their sessions" ON job_sessions FOR UPDATE USING (
  freelancer_id = auth.uid()
);
CREATE POLICY "System can insert sessions" ON job_sessions FOR INSERT WITH CHECK (true);

-- 9. RLS Policies for escrow_transactions
CREATE POLICY "Users can view their escrow transactions" ON escrow_transactions FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "System can insert escrow transactions" ON escrow_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update escrow transactions" ON escrow_transactions FOR UPDATE USING (true);

-- 10. RLS Policies for job_disputes
CREATE POLICY "Users can view disputes on their sessions" ON job_disputes FOR SELECT USING (
  session_id IN (SELECT id FROM job_sessions WHERE customer_id = auth.uid() OR freelancer_id = auth.uid())
);
CREATE POLICY "Users can create disputes" ON job_disputes FOR INSERT WITH CHECK (
  reporter_id = auth.uid()
);
CREATE POLICY "Admins can update disputes" ON job_disputes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin'))
);

-- 11. Function to auto-expire jobs after 5 hours
CREATE OR REPLACE FUNCTION expire_old_jobs()
RETURNS void AS $$
BEGIN
  UPDATE job_postings 
  SET status = 'expired' 
  WHERE status = 'open' 
    AND expires_at < NOW() 
    AND hired_freelancer_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function to handle escrow release
CREATE OR REPLACE FUNCTION release_escrow(session_id UUID)
RETURNS void AS $$
DECLARE
  session_record RECORD;
  escrow_amount NUMERIC;
  freelancer_amount NUMERIC;
  maintenance_amount NUMERIC;
  admin_amount NUMERIC;
BEGIN
  SELECT * INTO session_record FROM job_sessions WHERE id = session_id;
  IF NOT FOUND THEN RETURN; END IF;
  
  SELECT escrow_amount INTO escrow_amount FROM job_postings WHERE id = session_record.job_id;
  IF escrow_amount IS NULL OR escrow_amount <= 0 THEN RETURN; END IF;
  
  freelancer_amount := escrow_amount * 0.80;
  maintenance_amount := escrow_amount * 0.10;
  admin_amount := escrow_amount * 0.10;
  
  -- Record transactions
  INSERT INTO escrow_transactions (job_id, session_id, user_id, amount, type, status)
  VALUES (session_record.job_id, session_id, session_record.freelancer_id, freelancer_amount, 'release_freelancer', 'completed');
  
  INSERT INTO escrow_transactions (job_id, session_id, user_id, amount, type, status)
  VALUES (session_record.job_id, session_id, session_record.customer_id, maintenance_amount, 'release_maintenance', 'completed');
  
  INSERT INTO escrow_transactions (job_id, session_id, user_id, amount, type, status)
  VALUES (session_record.job_id, session_id, session_record.customer_id, admin_amount, 'release_admin', 'completed');
  
  -- Update session
  UPDATE job_sessions SET escrow_released = TRUE, updated_at = NOW() WHERE id = session_id;
  
  -- Update freelancer stats
  UPDATE freelancer_profiles 
  SET completed_sessions = completed_sessions + 1,
      rating = CASE WHEN completed_sessions + 1 > 0 THEN ((rating * completed_sessions + COALESCE(session_record.freelancer_rating, 4)) / (completed_sessions + 1)) ELSE 4 END
  WHERE user_id = session_record.freelancer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger to auto-expire jobs
CREATE OR REPLACE FUNCTION trigger_expire_jobs()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM expire_old_jobs();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_expire_jobs_trigger
AFTER INSERT OR UPDATE ON job_postings
FOR EACH STATEMENT EXECUTE FUNCTION trigger_expire_jobs();