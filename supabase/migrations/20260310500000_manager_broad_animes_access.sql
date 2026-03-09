-- ============================================================
-- Fix: Allow managers broader INSERT and UPDATE access to animes
-- ============================================================
-- Problem 1: Managers couldn't insert new animes directly when creating
-- a new translation for a system-unrecognized anime.
-- Problem 2: The previous update policy only allowed a manager to update
-- an anime if they ALREADY had a translation for it. This fails when
-- a manager adds a translation and updates the cover simultaneously (because
-- the cover update hits first, before the translation linking).
--
-- Solution: We trust managers. We will add a function is_manager()
-- and use it to allow managers to INSERT and UPDATE into the animes table. 
-- ============================================================

-- Step 1: Create a secure function to check if a user is a manager of ANY group.
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fansub_groups
    WHERE manager_uid = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop the restrictive policy we made before
DROP POLICY IF EXISTS "manager_update_animes" ON animes;

-- Step 3: Create broader INSERT and UPDATE policies for managers
CREATE POLICY "manager_insert_animes_broad" ON animes
  FOR INSERT
  WITH CHECK (public.is_manager());

CREATE POLICY "manager_update_animes_broad" ON animes
  FOR UPDATE
  USING (public.is_manager())
  WITH CHECK (public.is_manager());
