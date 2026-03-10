-- Add secondary link column for alternative links (e.g. secondary telegram channel, alternative site)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'translations' AND column_name = 'secondary_link'
  ) THEN
    ALTER TABLE translations ADD COLUMN secondary_link VARCHAR(2048);
  END IF;
END $$;
