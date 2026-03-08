-- Smart Search: set trigram threshold INSIDE functions, broader matching
-- NOTE: set_limit() at migration level only affects this session.
-- RPC calls run in their own sessions with default threshold (0.3).
-- We must call set_limit() inside each function to ensure low threshold.

-- Updated search_animes: set_limit inside function for typo tolerance
CREATE OR REPLACE FUNCTION search_animes(search_query TEXT)
RETURNS TABLE (
  id               UUID,
  title_he         TEXT,
  title_en         TEXT,
  title_romaji     TEXT,
  cover_image_url  TEXT,
  genres           TEXT[],
  similarity_score FLOAT
) AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Set low threshold for fuzzy matching (default 0.3 is too strict)
  PERFORM set_limit(0.08);
  normalized := lower(trim(search_query));

  RETURN QUERY
  SELECT
    a.id,
    a.title_he,
    a.title_en,
    a.title_romaji,
    a.cover_image_url,
    a.genres,
    GREATEST(
      similarity(a.title_he,  normalized),
      similarity(a.title_en,  normalized),
      COALESCE(similarity(a.title_romaji, normalized), 0),
      CASE WHEN lower(a.title_he) LIKE '%' || normalized || '%' THEN 0.5 ELSE 0 END,
      CASE WHEN lower(a.title_en) LIKE '%' || normalized || '%' THEN 0.5 ELSE 0 END,
      CASE WHEN a.title_romaji IS NOT NULL AND lower(a.title_romaji) LIKE '%' || normalized || '%' THEN 0.5 ELSE 0 END
    ) AS similarity_score
  FROM animes a
  WHERE
    a.title_he  % normalized
    OR a.title_en % normalized
    OR a.title_romaji % normalized
    OR lower(a.title_he) LIKE '%' || normalized || '%'
    OR lower(a.title_en) LIKE '%' || normalized || '%'
    OR (a.title_romaji IS NOT NULL AND lower(a.title_romaji) LIKE '%' || normalized || '%')
  ORDER BY similarity_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Updated search_fansubs: set_limit inside, search description, no is_active filter
CREATE OR REPLACE FUNCTION search_fansubs(search_query TEXT)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  logo_url          TEXT,
  description       TEXT,
  translation_count BIGINT,
  similarity_score  FLOAT
) AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Set low threshold for fuzzy matching
  PERFORM set_limit(0.08);
  normalized := lower(trim(search_query));

  RETURN QUERY
  SELECT
    fg.id,
    fg.name,
    fg.logo_url,
    fg.description,
    COUNT(t.id) AS translation_count,
    GREATEST(
      similarity(fg.name, normalized),
      COALESCE(similarity(fg.description, normalized), 0),
      CASE WHEN lower(fg.name) LIKE '%' || normalized || '%'
           THEN 0.5 ELSE 0 END,
      CASE WHEN fg.description IS NOT NULL AND lower(fg.description) LIKE '%' || normalized || '%'
           THEN 0.3 ELSE 0 END
    ) AS similarity_score
  FROM fansub_groups fg
  LEFT JOIN translations t ON t.fansub_id = fg.id
  WHERE
    fg.name % normalized
    OR lower(fg.name) LIKE '%' || normalized || '%'
    OR lower(fg.name) LIKE normalized || '%'
    OR (fg.description IS NOT NULL AND fg.description % normalized)
    OR (fg.description IS NOT NULL AND lower(fg.description) LIKE '%' || normalized || '%')
  GROUP BY fg.id
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
