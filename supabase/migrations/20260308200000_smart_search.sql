-- Smart Search: lower trigram threshold, broader matching, search fansub descriptions

-- Lower trigram threshold for better partial/typo matching
SELECT set_limit(0.08);

-- Updated search_animes: normalize input, broader LIKE matching
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

-- Updated search_fansubs: also search description, remove is_active filter for broader matching
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
