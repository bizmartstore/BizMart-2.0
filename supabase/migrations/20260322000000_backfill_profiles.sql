-- 1. Ensure all required columns exist in the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS bcoins NUMERIC DEFAULT 0;

-- 2. Sync existing data from auth.users to public.profiles
INSERT INTO public.profiles (id, email, first_name, last_name, school, section, grade_level, bcoins)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'first_name', ''), 
  COALESCE(raw_user_meta_data->>'last_name', ''), 
  COALESCE(raw_user_meta_data->>'school', ''), 
  COALESCE(raw_user_meta_data->>'section', ''), 
  COALESCE(raw_user_meta_data->>'grade_level', ''),
  0
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
  last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
  school = COALESCE(NULLIF(EXCLUDED.school, ''), profiles.school),
  section = COALESCE(NULLIF(EXCLUDED.section, ''), profiles.section),
  grade_level = COALESCE(NULLIF(EXCLUDED.grade_level, ''), profiles.grade_level);