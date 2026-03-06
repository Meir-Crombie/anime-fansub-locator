-- Migration: Add profile fields for email/password auth
-- Run this in the Supabase SQL Editor

-- Add first_name and age columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS age        INTEGER CHECK (age >= 13);

-- Update the trigger function to populate first_name from user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, first_name)
  VALUES (
    NEW.id,
    'viewer',
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
