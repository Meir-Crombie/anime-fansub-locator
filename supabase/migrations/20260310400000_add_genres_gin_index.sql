-- ============================================================
-- Optimization: Add GIN index to genres array column in animes
-- ============================================================
-- Problem: Filtering animes by genre using the .contains() operator 
-- (@>) results in a sequential scan, which is very slow as the table grows.
--
-- Solution: Add a Generalized Inverted Index (GIN) which is optimized
-- for fast searching within array elements.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_animes_genres ON animes USING GIN (genres);
