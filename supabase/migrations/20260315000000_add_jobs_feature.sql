-- 1. Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS public.job_reviews CASCADE;
DROP TABLE IF EXISTS public.job_sessions CASCADE;
DROP TABLE IF EXISTS public.job_bids CASCADE;
DROP TABLE IF EXISTS public.job_postings CASCADE;
DROP TABLE IF EXISTS public.freelancer_profiles CASCADE;

-- 2. Create Freelancer Profiles
CREATE TABLE public.freelancer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    bio TEXT,
    subjects TEXT[],
    experience TEXT,
    academic_strengths TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    completed_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- 3. Create Job Postings (Plural)
CREATE TABLE public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, hired, in_progress, completed, disputed, canceled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '3 hours') NOT NULL,
    hired_freelancer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. Create Job Bids
CREATE TABLE public.job_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bid_rate DECIMAL(10,2) NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Create Job Sessions
CREATE TABLE public.job_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_cost DECIMAL(10,2),
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, waiting_review, completed, disputed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Create Job Reviews
CREATE TABLE public.job_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Enable RLS
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_reviews ENABLE ROW LEVEL SECURITY;

-- 8. Create Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.freelancer_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.freelancer_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Jobs are viewable by everyone" ON public.job_postings FOR SELECT USING (true);
CREATE POLICY "Users can create jobs" ON public.job_postings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their own jobs" ON public.job_postings FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Bids are viewable by job owner and bidder" ON public.job_bids FOR SELECT USING (auth.uid() = freelancer_id OR auth.uid() IN (SELECT client_id FROM job_postings WHERE id = job_id));
CREATE POLICY "Freelancers can bid" ON public.job_bids FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Sessions are viewable by participants" ON public.job_sessions FOR SELECT USING (auth.uid() = freelancer_id OR auth.uid() = client_id);

-- 9. CRITICAL: Grant permissions to API roles to fix schema cache issues
GRANT ALL ON public.freelancer_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.job_postings TO anon, authenticated, service_role;
GRANT ALL ON public.job_bids TO anon, authenticated, service_role;
GRANT ALL ON public.job_sessions TO anon, authenticated, service_role;
GRANT ALL ON public.job_reviews TO anon, authenticated, service_role;