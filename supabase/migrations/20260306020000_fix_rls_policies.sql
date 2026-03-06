-- ============================================================
-- Migration: Fix RLS policies for profiles and form_fields
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- 0. Helper function to safely check admin role without RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. PROFILES TABLE — RLS Policies
-- ============================================================
-- Enable RLS (safe to run even if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read profiles (needed for admin checks, navbar role display)
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles
  FOR SELECT USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Allow admins full access to all profiles (uses SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (public.is_admin());

-- Allow new profile insertion (for the trigger and signup)
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. FORM_FIELDS TABLE — RLS Policies
-- ============================================================
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active form fields (needed for the application form)
DROP POLICY IF EXISTS "public_read_form_fields" ON form_fields;
CREATE POLICY "public_read_form_fields" ON form_fields
  FOR SELECT USING (true);

-- Allow admins to manage form fields
DROP POLICY IF EXISTS "admin_manage_form_fields" ON form_fields;
CREATE POLICY "admin_manage_form_fields" ON form_fields
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 3. FANSUB_APPLICATIONS TABLE — RLS Policies
-- ============================================================
ALTER TABLE fansub_applications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own applications
DROP POLICY IF EXISTS "users_insert_applications" ON fansub_applications;
CREATE POLICY "users_insert_applications" ON fansub_applications
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- Allow users to read their own applications
DROP POLICY IF EXISTS "users_read_own_applications" ON fansub_applications;
CREATE POLICY "users_read_own_applications" ON fansub_applications
  FOR SELECT USING (
    submitted_by = auth.uid()
    OR public.is_admin()
  );

-- Allow admins full access
DROP POLICY IF EXISTS "admin_all_applications" ON fansub_applications;
CREATE POLICY "admin_all_applications" ON fansub_applications
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 4. SEARCH_ANALYTICS TABLE — RLS Policies
-- ============================================================
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public read (for the search feature)
DROP POLICY IF EXISTS "public_read_search_analytics" ON search_analytics;
CREATE POLICY "public_read_search_analytics" ON search_analytics
  FOR SELECT USING (true);

-- Allow public insert/update (for logging searches)
DROP POLICY IF EXISTS "public_upsert_search_analytics" ON search_analytics;
CREATE POLICY "public_upsert_search_analytics" ON search_analytics
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_search_analytics" ON search_analytics;
CREATE POLICY "public_update_search_analytics" ON search_analytics
  FOR UPDATE USING (true);

-- Allow admins to delete/manage
DROP POLICY IF EXISTS "admin_all_search_analytics" ON search_analytics;
CREATE POLICY "admin_all_search_analytics" ON search_analytics
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 5. Ensure handle_new_user trigger exists
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'viewer',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 6. Set your user as admin (replace with your actual user ID)
--    First, find your user ID:
-- ============================================================
-- Run this to find the user ID for meircrombie@gmail.com:
-- SELECT id FROM auth.users WHERE email = 'meircrombie@gmail.com';
--
-- Then set them as admin:
-- UPDATE profiles SET role = 'admin' WHERE id = '<YOUR_USER_ID>';
--
-- Or do it in one step:
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'meircrombie@gmail.com');
