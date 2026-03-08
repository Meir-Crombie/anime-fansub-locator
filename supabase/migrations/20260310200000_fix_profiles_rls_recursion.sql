-- ============================================================
-- Fix: infinite recursion in profiles RLS policy
-- ============================================================
-- profiles_select_admin references profiles table from within
-- a policy ON profiles → causes infinite recursion (error 42P17).
-- Fix: use is_admin() SECURITY DEFINER function that bypasses RLS.

-- Step 1: Update is_admin() to also cover super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop the broken policy
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

-- Step 3: Re-create using is_admin() (SECURITY DEFINER = no RLS recursion)
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
USING (public.is_admin());
