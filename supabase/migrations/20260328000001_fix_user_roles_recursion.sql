-- 1. Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "admins_select_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_insert_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_update_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_delete_user_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_manage_user_roles" ON user_roles;

-- 2. Create a SECURITY DEFINER function to safely check roles without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- 3. Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 4. Create a single comprehensive policy for admins to manage roles
CREATE POLICY "admins_manage_user_roles" ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('main_admin', 'member_admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('main_admin', 'member_admin'));