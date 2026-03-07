# אפיון מלא של בסיס הנתונים — Israeli Anime Fansub Hub

> מסמך זה מפרט את כל הטבלאות, העמודות, ה-ENUMs, ה-RPCs, מדיניות RLS, הטריגרים, וההרחבות הנדרשים.
> כל שורה נגזרת ישירות מהקוד (actions, pages, API routes, components).

---

## 📦 PostgreSQL Extensions

| Extension | Purpose |
|-----------|---------|
| `uuid-ossp` | `uuid_generate_v4()` for primary keys |
| `pg_trgm` | Trigram fuzzy search (`similarity()`, `%` operator) |

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT set_limit(0.1); -- lower threshold for short Hebrew queries
```

---

## 📋 ENUMs

| Enum Name | Values | Used On |
|-----------|--------|---------|
| `translation_status` | `ongoing`, `completed`, `dropped` | `translations.status` |
| `translation_platform` | `website`, `telegram`, `discord`, `youtube` | `translations.platform` |
| `fansub_status` | `pending`, `approved`, `rejected` | `fansub_applications.status`, `fansub_groups.status` |
| `announcement_type` | `episode_release`, `new_project`, `completed`, `general` | `announcements.type` |

```sql
DO $$ BEGIN
  CREATE TYPE translation_status   AS ENUM ('ongoing', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE translation_platform AS ENUM ('website', 'telegram', 'discord', 'youtube');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fansub_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE announcement_type AS ENUM ('episode_release', 'new_project', 'completed', 'general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

---

## 🗄️ Tables

### 1. `animes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `title_he` | `VARCHAR(255)` | NOT NULL | Hebrew title — primary display |
| `title_en` | `VARCHAR(255)` | NOT NULL | English title |
| `title_romaji` | `VARCHAR(255)` | nullable | Romaji — used in fuzzy search |
| `synopsis` | `TEXT` | nullable | Anime description |
| `cover_image_url` | `VARCHAR(512)` | nullable | Supabase Storage or external URL |
| `genres` | `TEXT[]` | DEFAULT `'{}'` | e.g. `{action,isekai}` |
| `mal_id` | `INTEGER` | nullable | MyAnimeList ID |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Updated via trigger |

**Indexes:**
- GIN index on `title_he gin_trgm_ops` (trigram search)
- GIN index on `title_en gin_trgm_ops` (trigram search)
- GIN index on `title_romaji gin_trgm_ops` (trigram search)

**Used in:** homepage (count + recent list), anime detail page, admin animes, search RPC

---

### 2. `fansub_groups`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `name` | `VARCHAR(255)` | NOT NULL, UNIQUE | Group name |
| `description` | `TEXT` | nullable | |
| `website_url` | `VARCHAR(512)` | nullable | |
| `telegram_url` | `VARCHAR(512)` | nullable | |
| `discord_url` | `VARCHAR(512)` | nullable | |
| `logo_url` | `VARCHAR(512)` | nullable | |
| `manager_uid` | `UUID` | FK → `auth.users(id)`, nullable | Group owner/manager |
| `is_active` | `BOOLEAN` | DEFAULT `true` | Soft delete / visibility |
| `status` | `fansub_status` | DEFAULT `'approved'` | Approval status |
| `established_year` | `INTEGER` | nullable, CHECK 1990–2100 | |
| `activity_status` | `VARCHAR(50)` | DEFAULT `'active'`, CHECK IN (`active`,`on_break`,`inactive`) | |
| `translation_domains` | `TEXT[]` | DEFAULT `'{}'` | |
| `flagship_projects` | `TEXT` | nullable | |
| `is_recruiting` | `BOOLEAN` | DEFAULT `false` | |
| `recruiting_roles` | `TEXT[]` | DEFAULT `'{}'` | |
| `recruitment_contact` | `TEXT` | nullable | |
| `submitter_name` | `VARCHAR(255)` | nullable | From application form |
| `submitter_role` | `VARCHAR(255)` | nullable | |
| `submitter_contact` | `VARCHAR(255)` | nullable | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

**Indexes:**
- GIN index on `name gin_trgm_ops` (fansub search)

**Used in:** homepage (count), fansubs listing, fansub detail, dashboard, admin fansubs, search_fansubs RPC

---

### 3. `translations` (many-to-many junction: animes ↔ fansub_groups)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | Explicit PK for RLS |
| `anime_id` | `UUID` | FK → `animes(id)` ON DELETE CASCADE, NOT NULL | |
| `fansub_id` | `UUID` | FK → `fansub_groups(id)` ON DELETE CASCADE, NOT NULL | |
| `status` | `translation_status` | NOT NULL | |
| `platform` | `translation_platform` | NOT NULL | |
| `direct_link` | `VARCHAR(512)` | NOT NULL | The watch/download URL |
| `notes` | `TEXT` | nullable | e.g. "Blu-ray only" |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

**Constraints:**
- UNIQUE `(anime_id, fansub_id, platform)` — prevents duplicates

**Used in:** anime detail, fansub detail, dashboard, admin overview, admin stats

---

### 4. `profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, FK → `auth.users(id)` | 1-to-1 with Supabase Auth |
| `role` | `VARCHAR(50)` | DEFAULT `'viewer'` | `viewer` / `manager` / `admin` |
| `display_name` | `VARCHAR(255)` | nullable | |
| `first_name` | `VARCHAR(100)` | nullable | From registration metadata |
| `age` | `INTEGER` | nullable, CHECK `>= 13` | |

**Used in:** root layout (role check), Navbar (role for tab visibility), admin (user list, role changes)

---

### 5. `search_analytics`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `query_string` | `VARCHAR(500)` | PK | Lowercased + trimmed |
| `search_count` | `INTEGER` | DEFAULT `1` | Incremented via RPC |
| `last_searched` | `TIMESTAMPTZ` | DEFAULT `now()` | |
| `resolved` | `BOOLEAN` | DEFAULT `false` | Admin marks true when anime added |

**Used in:** search API (logs unsatisfied queries), admin analytics page, admin overview

---

### 6. `ratings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `fansub_id` | `UUID` | FK → `fansub_groups(id)` ON DELETE CASCADE, NOT NULL | |
| `user_id` | `UUID` | FK → `auth.users(id)`, NOT NULL | |
| `score` | `INTEGER` | NOT NULL, CHECK 1–5 | |
| `review` | `TEXT` | nullable | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

**Constraints:**
- UNIQUE `(fansub_id, user_id)` — one rating per user per group

**Used in:** RatingWidget, fansub detail (avg scores), dashboard (group ratings)

---

### 7. `announcements`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `fansub_id` | `UUID` | FK → `fansub_groups(id)` ON DELETE CASCADE, NOT NULL | |
| `anime_id` | `UUID` | FK → `animes(id)`, nullable | Optional link to anime |
| `title` | `VARCHAR(255)` | NOT NULL | |
| `content` | `TEXT` | NOT NULL | |
| `type` | `announcement_type` | DEFAULT `'general'` | |
| `is_published` | `BOOLEAN` | DEFAULT `true` | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |

**Used in:** fansub detail (public announcements), dashboard (manage announcements)

---

### 8. `episode_progress`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `translation_id` | `UUID` | FK → `translations(id)` ON DELETE CASCADE, UNIQUE | 1-to-1 |
| `total_episodes` | `INTEGER` | nullable | |
| `translated_episodes` | `INTEGER` | DEFAULT `0` | |
| `last_episode_at` | `TIMESTAMPTZ` | nullable | |

**Used in:** fansub detail, dashboard (progress bars)

---

### 9. `fansub_applications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `submitted_by` | `UUID` | FK → `auth.users(id)`, nullable | |
| `form_data` | `JSONB` | NOT NULL | Dynamic form submission data |
| `status` | `fansub_status` | DEFAULT `'pending'` | |
| `admin_notes` | `TEXT` | nullable | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | |
| `reviewed_at` | `TIMESTAMPTZ` | nullable | |
| `reviewed_by` | `UUID` | FK → `auth.users(id)`, nullable | |

**Used in:** fansubs/apply submission, admin applications view, approve/reject actions

---

### 10. `form_fields`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `form_name` | `VARCHAR(100)` | NOT NULL | Currently: `'fansub_registration'` |
| `field_key` | `VARCHAR(100)` | NOT NULL | |
| `field_label_he` | `VARCHAR(255)` | NOT NULL | Hebrew label |
| `field_label_en` | `VARCHAR(255)` | NOT NULL | English label |
| `field_type` | `VARCHAR(50)` | NOT NULL | text, textarea, url, email, date, select, etc. |
| `is_required` | `BOOLEAN` | DEFAULT `false` | |
| `sort_order` | `INTEGER` | DEFAULT `0` | Display ordering |
| `is_active` | `BOOLEAN` | DEFAULT `true` | |
| `options` | `JSONB` | nullable | For select/radio fields |
| `placeholder_he` | `VARCHAR(255)` | nullable | |

**Used in:** form-builder admin page, fansubs/apply dynamic form

---

### 11. `site_settings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `key` | `VARCHAR(100)` | PK | Setting identifier |
| `value` | `TEXT` | NOT NULL | Setting value |

**Default rows:**
- `('inactivity_threshold_months', '6')`

**Used in:** admin overview (inactivity threshold), update_inactive_groups RPC

---

## 🔧 Helper Functions

### `is_admin()`
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```
Used in all admin-level RLS policies to avoid recursion.

### `handle_new_user()` (trigger function)
```sql
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
```

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 📡 RPC Functions

### 1. `search_animes(search_query TEXT)`
Fuzzy search across `title_he`, `title_en`, `title_romaji` with LIKE fallback.

**Returns:** `id, title_he, title_en, title_romaji, cover_image_url, genres, similarity_score`

**Called from:** `/api/search` (POST), `/search` page (direct RPC)

---

### 2. `search_fansubs(search_query TEXT)`
Fuzzy search on `fansub_groups.name` with LIKE fallback. Filters by `is_active = true`.

**Returns:** `id, name, logo_url, description, translation_count, similarity_score`

**Called from:** `/api/search-fansubs` (POST)

---

### 3. `increment_search_count(p_query TEXT)`
Upserts into `search_analytics`: increment count or insert new row.

**Called from:** `/api/search` (on empty results), `actions/analytics.ts`

---

### 4. `get_all_genres()`
Unnests all `animes.genres` arrays, returns distinct sorted list.

**Returns:** `genre TEXT`

**Called from:** `/api/genres` (GET)

---

### 5. `get_random_anime_filtered(p_genres, p_min_ep, p_max_ep, p_min_season, p_max_season)`
Returns one random anime, optionally filtered by genres/episode count.

**Returns:** `id, title_he, title_en`

**Called from:** `/api/randomize` (POST)

---

### 6. `get_similar_searches(p_query TEXT, p_threshold FLOAT DEFAULT 0.1)`
Finds similar unresolved search queries using trigram similarity.

**Returns:** `query_string, search_count, last_searched, resolved, similarity_score`

**Called from:** `/api/similar-searches` (GET)

---

### 7. `update_inactive_groups()`
Marks fansub groups as `activity_status = 'inactive'` if no translations updated within threshold months.

**Returns:** `INTEGER` (count of updated groups)

**Called from:** `/api/admin/check-inactive` (POST)

---

### 8. `get_site_stats()` (optional)
Returns aggregate counts for animes, fansub_groups, translations.

**Returns:** `total_animes, total_fansub_groups, total_translations`

---

## 🔒 RLS Policies

### `animes`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_animes` | SELECT | `true` |
| `admin_write_animes` | ALL | `public.is_admin()` |

### `fansub_groups`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_fansubs` | SELECT | `true` |
| `manager_update_own` | UPDATE | `manager_uid = auth.uid()` |
| `admin_all_fansubs` | ALL | `public.is_admin()` |

### `translations`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_translations` | SELECT | `true` |
| `manager_write_translations` | ALL | Manager of the fansub OR admin |

### `profiles`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_profiles` | SELECT | `true` |
| `users_update_own_profile` | UPDATE | `id = auth.uid()` |
| `admin_all_profiles` | ALL | `public.is_admin()` |
| `insert_own_profile` | INSERT | `id = auth.uid()` |

### `search_analytics`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_search_analytics` | SELECT | `true` |
| `public_upsert_search_analytics` | INSERT | `true` |
| `public_update_search_analytics` | UPDATE | `true` |
| `admin_all_search_analytics` | ALL | `public.is_admin()` |

### `ratings`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_ratings` | SELECT | `true` |
| `users_manage_own_ratings` | ALL | `user_id = auth.uid()` |

### `announcements`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_announcements` | SELECT | `true` |
| `manager_write_announcements` | ALL | Manager of the fansub OR admin |

### `episode_progress`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_progress` | SELECT | `true` |
| `manager_write_progress` | ALL | Manager of parent fansub OR admin |

### `fansub_applications`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `users_insert_applications` | INSERT | `submitted_by = auth.uid()` |
| `users_read_own_applications` | SELECT | Own OR admin |
| `admin_all_applications` | ALL | `public.is_admin()` |

### `form_fields`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `public_read_form_fields` | SELECT | `true` |
| `admin_manage_form_fields` | ALL | `public.is_admin()` |

### `site_settings`
| Policy | FOR | USING/WITH CHECK |
|--------|-----|-----------------|
| `settings_public_read` | SELECT | `true` |
| `settings_admin_write` | ALL | `public.is_admin()` |

---

## 🔗 Foreign Key Relationships

```
animes ←── translations (anime_id)
fansub_groups ←── translations (fansub_id)
translations ←── episode_progress (translation_id, 1-to-1)
fansub_groups ←── announcements (fansub_id)
animes ←── announcements (anime_id, nullable)
fansub_groups ←── ratings (fansub_id)
auth.users ←── profiles (id, 1-to-1)
auth.users ←── fansub_groups (manager_uid)
auth.users ←── fansub_applications (submitted_by)
auth.users ←── fansub_applications (reviewed_by)
auth.users ←── ratings (user_id)
```

---

## 🔑 Admin User Setup

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'meircrombie@gmail.com');
```
