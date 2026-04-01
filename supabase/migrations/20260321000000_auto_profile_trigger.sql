CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, first_name, last_name, school, section, grade_level, bcoins)
  VALUES (
    NEW.id,
    NEW.id, -- Populate user_id with the same ID
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'school', ''),
    COALESCE(NEW.raw_user_meta_data->>'section', ''),
    COALESCE(NEW.raw_user_meta_data->>'grade_level', ''),
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.id,
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
    school = COALESCE(NULLIF(EXCLUDED.school, ''), profiles.school),
    section = COALESCE(NULLIF(EXCLUDED.section, ''), profiles.section),
    grade_level = COALESCE(NULLIF(EXCLUDED.grade_level, ''), profiles.grade_level);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;