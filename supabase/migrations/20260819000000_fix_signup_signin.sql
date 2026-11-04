-- ============================================================
-- BizMart: Fix signup/signin by auto-creating profile, wallet,
-- and assigning admin roles on user creation.
-- Run this once in the Supabase SQL editor (Dashboard > SQL).
-- ============================================================

-- 1. Auto-create profile + wallet + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Never let a profile/wallet insert failure block user signup
  BEGIN
    INSERT INTO public.profiles (id, user_id, first_name, last_name, section, grade_level, school, email, avatar_url)
    VALUES (
      NEW.id,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'section', ''),
      COALESCE(NEW.raw_user_meta_data->>'grade_level', ''),
      COALESCE(NEW.raw_user_meta_data->>'school', ''),
      COALESCE(NEW.email, ''),
      NULL
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.bcoins_wallets (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF NEW.email = 'sheethappenswithjaa@gmail.com' THEN
    _role := 'main_admin'::public.app_role;
  ELSIF NEW.email = 'bizmartadmin@gmail.com' THEN
    _role := 'member_admin'::public.app_role;
  END IF;

  IF _role IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
      ON CONFLICT DO NOTHING;
      UPDATE public.profiles SET role = _role::text WHERE user_id = NEW.id AND role IS DISTINCT FROM _role::text;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill profiles for existing auth users that have no profile yet
INSERT INTO public.profiles (id, user_id, first_name, last_name, section, grade_level, school, email, avatar_url)
SELECT
  u.id, u.id,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'section', ''),
  COALESCE(u.raw_user_meta_data->>'grade_level', ''),
  COALESCE(u.raw_user_meta_data->>'school', ''),
  COALESCE(u.email, ''),
  NULL
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Backfill wallets for existing auth users that have no wallet yet
INSERT INTO public.bcoins_wallets (user_id, balance)
SELECT u.id, 0
FROM auth.users u
LEFT JOIN public.bcoins_wallets w ON w.user_id = u.id
WHERE w.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Backfill admin roles for known admin emails
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'main_admin'::public.app_role FROM auth.users u WHERE u.email = 'sheethappenswithjaa@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'member_admin'::public.app_role FROM auth.users u WHERE u.email = 'bizmartadmin@gmail.com'
ON CONFLICT DO NOTHING;

-- 5. Mirror user_roles into profiles.role so the app resolves roles correctly
UPDATE public.profiles p
SET role = r.role::text
FROM public.user_roles r
WHERE r.user_id = p.user_id
  AND p.role IS DISTINCT FROM r.role::text;

-- 6. Ensure profiles.role has a default for brand-new profiles
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';

SELECT 'BizMart auth setup complete' AS result;