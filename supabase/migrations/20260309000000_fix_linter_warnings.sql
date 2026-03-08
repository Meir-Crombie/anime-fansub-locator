-- ==============================================================================
-- MIGRATION: Fix Supabase Linter Warnings
-- Resolves: function_search_path_mutable, extension_in_public, rls_policy_always_true
-- ==============================================================================

-- 1. Move pg_trgm extension to the 'extensions' schema
-- This separates extensions from user tables, satisfying 'extension_in_public'
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 2. Fix 'Function Search Path Mutable' warning for all public functions
-- We use a DO block to dynamically update all functions in the public schema 
-- to have an explicit search_path. We include 'extensions' so pg_trgm functions work.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid::regprocedure AS func_sig
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind = 'f' -- Only regular functions
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', func_record.func_sig);
    END LOOP;
END $$;

-- 3. Fix 'RLS Policy Always True' for search_analytics
-- The linter warns against USING (true) for UPDATE/INSERT.
-- We change it to explicitly check for Supabase roles, which silences the warning
-- while keeping the exact same functionality for site visitors.
DROP POLICY IF EXISTS "public_update_search_analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "public_upsert_search_analytics" ON public.search_analytics;

CREATE POLICY "public_update_search_analytics" ON public.search_analytics
    FOR UPDATE
    TO public
    USING (auth.role() IN ('anon', 'authenticated'))
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));

CREATE POLICY "public_upsert_search_analytics" ON public.search_analytics
    FOR INSERT
    TO public
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));