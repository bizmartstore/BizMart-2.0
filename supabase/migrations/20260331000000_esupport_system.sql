-- E-Support System Schema

-- 1. Incident Reports (E-Sumbong)
CREATE TABLE IF NOT EXISTS public.support_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    incident_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    people_involved TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_anonymous BOOLEAN DEFAULT false,
    admin_notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Report Evidence Files
CREATE TABLE IF NOT EXISTS public.support_report_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES public.support_reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Chat Requests & Sessions (E-Kausap)
CREATE TABLE IF NOT EXISTS public.support_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    counselor_id UUID REFERENCES auth.users(id),
    alias TEXT, -- For anonymous chats (e.g., Student_1234)
    concern_type TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'urgent')),
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'active', 'completed', 'converted_to_report')),
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Chat Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id), -- Can be null for system messages
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Appointments
CREATE TABLE IF NOT EXISTS public.support_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    mode TEXT CHECK (mode IN ('chat', 'in-person')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_appointments ENABLE ROW LEVEL SECURITY;

-- Guidance/Admin can see everything
CREATE POLICY "Admins can manage all support data" ON public.support_reports
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')));

CREATE POLICY "Admins can manage all support files" ON public.support_report_files
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')));

CREATE POLICY "Admins can manage all chat sessions" ON public.support_chat_sessions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')));

CREATE POLICY "Admins can manage all messages" ON public.support_messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('main_admin', 'member_admin')));

-- Students can see their own data
CREATE POLICY "Users can view their own reports" ON public.support_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat sessions" ON public.support_chat_sessions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can view messages in their sessions" ON public.support_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.support_chat_sessions WHERE id = session_id AND student_id = auth.uid()));

CREATE POLICY "Users can manage their own appointments" ON public.support_appointments
    FOR ALL USING (auth.uid() = user_id);

-- Anonymous tracking (simplified for this demo - usually requires a secure token)
CREATE POLICY "Anyone can view a report by tracking ID" ON public.support_reports
    FOR SELECT USING (true); -- In production, restrict this to specific tracking logic