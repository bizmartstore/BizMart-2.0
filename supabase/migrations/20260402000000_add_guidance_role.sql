-- Update the user_roles constraint to include 'guidance'
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('main_admin', 'member_admin', 'guidance', 'customer'));

-- Ensure guidance has access to support tables
CREATE POLICY "Guidance can manage all support data" ON public.support_reports
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'guidance'));

CREATE POLICY "Guidance can manage all support files" ON public.support_report_files
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'guidance'));

CREATE POLICY "Guidance can manage all chat sessions" ON public.support_chat_sessions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'guidance'));

CREATE POLICY "Guidance can manage all messages" ON public.support_messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'guidance'));