-- This script populates the profiles table with data from existing auth users
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