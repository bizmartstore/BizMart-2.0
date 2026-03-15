
-- Add tracking columns to seller_codes
ALTER TABLE public.seller_codes ADD COLUMN IF NOT EXISTS generated_by UUID DEFAULT NULL;
ALTER TABLE public.seller_codes ADD COLUMN IF NOT EXISTS sent_to_name TEXT DEFAULT '';
ALTER TABLE public.seller_codes ADD COLUMN IF NOT EXISTS sent_to_user_id UUID DEFAULT NULL;
ALTER TABLE public.seller_codes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add tracking columns to club_codes
ALTER TABLE public.club_codes ADD COLUMN IF NOT EXISTS generated_by UUID DEFAULT NULL;
ALTER TABLE public.club_codes ADD COLUMN IF NOT EXISTS sent_to_name TEXT DEFAULT '';
ALTER TABLE public.club_codes ADD COLUMN IF NOT EXISTS sent_to_user_id UUID DEFAULT NULL;
ALTER TABLE public.club_codes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
