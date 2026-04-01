-- 1. Ensure all required columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS bcoins NUMERIC DEFAULT 0;

-- 2. Sync existing data, ensuring both 'id' and 'user_id' are populated
INSERT INTO public.profiles (id, user_id, email, first_name, last_name, school, section, grade_level, bcoins)
SELECT 
  id, 
  id as user_id, -- Use the same ID for both columns
  email, 
  COALESCE(raw_user_meta_data->>'first_name', ''), 
  COALESCE(raw_user_meta_data->>'last_name', ''), 
  COALESCE(raw_user_meta_data->>'school', ''), 
  COALESCE(raw_user_meta_data->>'section', ''), 
  COALESCE(raw_user_meta_data->>'grade_level', ''),
  0
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.id,
  email = EXCLUDED.email,
  first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
  last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
  school = COALESCE(NULLIF(EXCLUDED.school, ''), profiles.school),
  section = COALESCE(NULLIF(EXCLUDED.section, ''), profiles.section),
  grade_level = COALESCE(NULLIF(EXCLUDED.grade_level, ''), profiles.grade_level);