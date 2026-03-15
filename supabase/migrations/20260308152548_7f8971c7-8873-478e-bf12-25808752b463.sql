
-- Fix overly permissive RLS on club_codes
DROP POLICY "Authenticated users can read unused codes" ON public.club_codes;
DROP POLICY "Authenticated users can update codes" ON public.club_codes;

-- Only allow reading unused codes
CREATE POLICY "Users can read unused codes" ON public.club_codes FOR SELECT TO authenticated USING (is_used = false);

-- Only allow marking a code as used by setting used_by to own user id
CREATE POLICY "Users can claim unused codes" ON public.club_codes FOR UPDATE TO authenticated USING (is_used = false) WITH CHECK (used_by = auth.uid() AND is_used = true);
