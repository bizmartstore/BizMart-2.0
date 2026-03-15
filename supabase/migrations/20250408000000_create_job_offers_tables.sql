-- Enable RLS on all tables
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_earnings ENABLE ROW LEVEL SECURITY;

-- Job Requests Table: Stores available jobs that members can apply for
CREATE TABLE IF NOT EXISTS job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('tutoring', 'event_help', 'delivery', 'tech_support', 'errand', 'other')),
  location TEXT NOT NULL,
  reward INTEGER NOT NULL, -- BCoins reward
  duration_minutes INTEGER NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  posted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
  max_applicants INTEGER DEFAULT 1,
  current_applicants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Sessions Table: Tracks active work sessions between assistants and jobs
CREATE TABLE IF NOT EXISTS job_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID REFERENCES job_requests(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  hours_worked DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_request_id, assistant_id)
);

-- Assistance Requests Table: Members can post requests for help
CREATE TABLE IF NOT EXISTS assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assistance_type TEXT NOT NULL CHECK (assistance_type IN ('tutoring', 'tech_help', 'delivery', 'event_support', 'other')),
  location TEXT NOT NULL,
  offer INTEGER NOT NULL, -- BCoins offered
  duration_minutes INTEGER NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Earnings Table: Tracks earnings from completed jobs
CREATE TABLE IF NOT EXISTS job_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_session_id UUID REFERENCES job_sessions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- BCoins earned
  payment_type TEXT NOT NULL DEFAULT 'bcoins' CHECK (payment_type IN ('bcoins', 'gcash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_requests_posted_by ON job_requests(posted_by);
CREATE INDEX IF NOT EXISTS idx_job_sessions_assistant_id ON job_sessions(assistant_id);
CREATE INDEX IF NOT EXISTS idx_job_sessions_status ON job_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_requester_id ON assistance_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_earnings_user_id ON job_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_earnings_status ON job_earnings(status);

-- RLS Policies

-- Job Requests: Anyone can view open jobs, only admins/sellers can post
CREATE POLICY "Anyone can view open job requests"
  ON job_requests FOR SELECT
  USING (status = 'open');

CREATE POLICY "Admins and sellers can insert job requests"
  ON job_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('main_admin', 'member_admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM seller_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins and sellers can update their own job requests"
  ON job_requests FOR UPDATE
  USING (
    posted_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('main_admin', 'member_admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM seller_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Job Sessions: Users can view their own sessions
CREATE POLICY "Users can view their own job sessions"
  ON job_sessions FOR SELECT
  USING (
    assistant_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE id = job_sessions.job_request_id
      AND posted_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert job sessions"
  ON job_sessions FOR INSERT
  WITH CHECK (assistant_id = auth.uid());

CREATE POLICY "Users can update their own job sessions"
  ON job_sessions FOR UPDATE
  USING (
    assistant_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE id = job_sessions.job_request_id
      AND posted_by = auth.uid()
    )
  );

-- Assistance Requests: Users can view their own requests
CREATE POLICY "Users can view their own assistance requests"
  ON assistance_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Users can insert assistance requests"
  ON assistance_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own assistance requests"
  ON assistance_requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR
    assigned_to = auth.uid()
  );

-- Job Earnings: Users can view their own earnings
CREATE POLICY "Users can view their own job earnings"
  ON job_earnings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert job earnings"
  ON job_earnings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update job earnings"
  ON job_earnings FOR UPDATE
  USING (true);

-- Functions for automatic updates

-- Update job request applicant count
CREATE OR REPLACE FUNCTION update_job_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE job_requests
    SET current_applicants = current_applicants + 1
    WHERE id = NEW.job_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE job_requests
    SET current_applicants = current_applicants - 1
    WHERE id = OLD.job_request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain applicant count
CREATE TRIGGER job_applicant_count_trigger
  AFTER INSERT OR DELETE ON job_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applicant_count();

-- Function to create earnings record when job is completed
CREATE OR REPLACE FUNCTION create_job_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Create earnings record for the assistant
    INSERT INTO job_earnings (
      user_id,
      job_session_id,
      amount,
      payment_type,
      status
    ) VALUES (
      NEW.assistant_id,
      NEW.id,
      -- Calculate reward from job request (could be more complex with hourly rates)
      (SELECT reward FROM job_requests WHERE id = NEW.job_request_id),
      'bcoins',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create earnings on job completion
CREATE TRIGGER create_job_earnings_trigger
  AFTER UPDATE OF status ON job_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_job_earnings();