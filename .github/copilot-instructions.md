# GitHub Copilot Instructions — Israeli Anime Fansub Hub
# Place this file at: .github/copilot-instructions.md

> Copilot must read this entire file before generating any code.
> These instructions override any default behavior. Follow them precisely.

---

## 🚨 ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES

### 1. ZERO FAKE DATA POLICY
**Never generate, suggest, or include fake/mock/placeholder data anywhere in this codebase.**

This means:
- No hardcoded arrays of anime titles, fansub names, or translation records
- No `"Naruto"`, `"One Piece"`, or any real/fictional anime title as example data
- No fake URLs like `"https://example.com"` or `"https://fansub-group.co.il"`
- No placeholder emails like `"admin@example.com"`
- No seed files with fake records (only schema-only migration files are allowed)
- No `// TODO: replace with real data` blocks that contain data below them
- No `initialData`, `defaultData`, or `mockData` variables with actual values

**The only acceptable response when data is absent is a proper empty state UI component.**

```tsx
// ✅ CORRECT — empty state when no data
if (!animes || animes.length === 0) {
  return <EmptyState message="No anime titles have been added yet." />
}

// ❌ WRONG — fake data as fallback
const animes = data ?? [{ id: "1", title_he: "נארוטו", title_en: "Naruto" }]
```

### 2. NO HARDCODED SECRETS
Never write API keys, connection strings, or secrets in code. Always use `process.env.VARIABLE_NAME`.

### 3. SERVICE ROLE KEY IS SERVER-ONLY
`SUPABASE_SERVICE_ROLE_KEY` must never appear in any file that has `"use client"` at the top, or in any file under `components/`. It belongs only in Server Actions and Route Handlers.

### 4. RLS IS ALWAYS ON
Never write `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`. All tables must have RLS active at all times.

### 5. NO `any` TYPE
Never use TypeScript `any`. Always use the generated types from `lib/types/database.types.ts`.

---

## 🗺️ Project Overview

**Name:** Israeli Anime Fansub Hub
**Language:** Hebrew-first UI (RTL layout), English supported
**Purpose:** A community directory where Israeli users discover which local fansub groups have translated which anime titles, the translation status, and where to watch them.

**Three user roles:**
| Role | What they can do |
|------|-----------------|
| Visitor (unauthenticated) | Browse all anime, search, use randomizer, view fansub pages |
| Fansub Manager (authenticated) | Manage their own group's translation entries only |
| Admin | Full CRUD on all content + view search analytics |

---

## ⚙️ Tech Stack — Use Exactly These

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js App Router | v14+, TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui | Dark mode via `next-themes` |
| Database | Supabase PostgreSQL | With `pg_trgm` extension enabled |
| Auth | Supabase GoTrue | Magic Link for managers, Email/Password for admin |
| Storage | Supabase Storage | For cover images and fansub logos |
| Validation | Zod | On every Server Action and Route Handler input |
| Hosting | Vercel | ISR + `revalidatePath` after mutations |
| Performance Monitoring | `@vercel/speed-insights` | Vercel's official Web Vitals tracker; zero-config, no third-party vendor |
| HTTP Client | Native `fetch` only | No axios, no react-query |

Do not install libraries outside this list without a comment explaining why.

---

## 📁 Folder Structure — Do Not Deviate

```
.github/
  copilot-instructions.md     ← THIS FILE

app/
  layout.tsx                  # Root layout: ThemeProvider, Navbar, RTL html dir
  page.tsx                    # Homepage: SearchBar + AnimeGrid (fetched server-side)
  loading.tsx                 # Root Suspense fallback
  error.tsx                   # Root error boundary
  anime/
    [id]/
      page.tsx                # Anime detail page (RSC) — all translations listed here
      loading.tsx
  fansub/
    [id]/
      page.tsx                # Fansub group public profile page
  search/
    page.tsx                  # Full search results (reads ?q= from searchParams)
  admin/
    layout.tsx                # Guard: redirect to /login if profiles.role !== 'admin'
    animes/page.tsx           # Admin: CRUD animes table
    fansubs/page.tsx          # Admin: manage fansub groups
    analytics/page.tsx        # Search wishlist — sorted by search_count DESC
  dashboard/
    layout.tsx                # Guard: redirect to /login if not authenticated
    page.tsx                  # Manager view: their group info + translation entries
    edit/page.tsx             # Add or edit a translation entry
  login/
    page.tsx                  # Magic link / email login form
  api/
    search/route.ts           # POST { query } → calls search_animes RPC
    randomize/route.ts        # GET → calls get_random_anime RPC → returns { id }
    suggest/route.ts          # POST → stores a user-suggested missing link

components/
  AnimeCard.tsx               # Cover image (next/image), Hebrew title, genre badges
  AnimeGrid.tsx               # CSS grid of AnimeCards — accepts real data or renders EmptyState
  SearchBar.tsx               # "use client" — debounced, calls /api/search
  RandomizerButton.tsx        # "use client" — fetch /api/randomize → router.push
  TranslationBadge.tsx        # Colored status chip + platform icon
  TranslationList.tsx         # Groups translations by fansub on anime detail page
  FansubCard.tsx              # Logo, name, social links
  GenreFilter.tsx             # "use client" — multi-select filter chips
  EmptyState.tsx              # Always shown instead of fake data when list is empty
  Navbar.tsx                  # Logo, search, dark mode toggle, auth state
  Skeleton/
    AnimeCardSkeleton.tsx     # shadcn Skeleton loading placeholder

lib/
  supabase/
    client.ts                 # createBrowserClient() — Client Components only
    server.ts                 # createServerClient() — RSC and Server Actions only
    middleware.ts             # Session refresh — called from root middleware.ts
  types/
    database.types.ts         # AUTO-GENERATED — run: supabase gen types typescript
    index.ts                  # Exports: Anime, FansubGroup, Translation, SearchAnalytic
  utils.ts                    # cn(), formatDate(), truncate(), debounce()
  constants.ts                # PLATFORMS, STATUSES, GENRES arrays for selects

actions/
  animes.ts                   # createAnime, updateAnime, deleteAnime
  translations.ts             # upsertTranslation, deleteTranslation
  fansubs.ts                  # updateFansubGroup (manager self-edit)
  analytics.ts                # logSearchQuery — upserts to search_analytics

middleware.ts                 # Root middleware: Supabase session refresh on all routes

.env.local                    # GITIGNORED — real values here
.env.example                  # COMMITTED — key names only, no values
```

---

## 🗄️ Database Schema

Reference these exact table and column names in every query. Never invent new column names.

### ENUMs (create before tables)
```sql
CREATE TYPE translation_status   AS ENUM ('ongoing', 'completed', 'dropped');
CREATE TYPE translation_platform AS ENUM ('website', 'telegram', 'discord', 'youtube');
```

### Table: `animes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK DEFAULT uuid_generate_v4()` | |
| `title_he` | `VARCHAR(255) NOT NULL` | Primary display title |
| `title_en` | `VARCHAR(255) NOT NULL` | |
| `title_romaji` | `VARCHAR(255)` | Nullable — used in fuzzy search |
| `synopsis` | `TEXT` | Nullable |
| `cover_image_url` | `VARCHAR(512)` | Nullable — Supabase Storage or external |
| `genres` | `TEXT[]` | e.g. `{action,isekai}` |
| `mal_id` | `INTEGER` | Nullable — MyAnimeList ID for future sync |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ DEFAULT now()` | Updated via trigger |

### Table: `fansub_groups`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK DEFAULT uuid_generate_v4()` | |
| `name` | `VARCHAR(255) NOT NULL UNIQUE` | |
| `description` | `TEXT` | Nullable |
| `website_url` | `VARCHAR(512)` | Nullable |
| `telegram_url` | `VARCHAR(512)` | Nullable |
| `discord_url` | `VARCHAR(512)` | Nullable |
| `logo_url` | `VARCHAR(512)` | Nullable |
| `manager_uid` | `UUID REFERENCES auth.users(id)` | Group owner |
| `is_active` | `BOOLEAN DEFAULT true` | Soft delete |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

### Table: `translations` (many-to-many junction)
| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK DEFAULT uuid_generate_v4()` | Explicit PK — makes RLS easier |
| `anime_id` | `UUID REFERENCES animes(id) ON DELETE CASCADE` | |
| `fansub_id` | `UUID REFERENCES fansub_groups(id) ON DELETE CASCADE` | |
| `status` | `translation_status NOT NULL` | |
| `platform` | `translation_platform NOT NULL` | |
| `direct_link` | `VARCHAR(512) NOT NULL` | The actual watch/download link |
| `notes` | `TEXT` | Nullable — e.g. "Blu-ray only", "Part 1" |
| `updated_at` | `TIMESTAMPTZ DEFAULT now()` | |
| UNIQUE | `(anime_id, fansub_id, platform)` | Prevents duplicates |

### Table: `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK REFERENCES auth.users(id)` | 1-to-1 with auth |
| `role` | `VARCHAR(50) DEFAULT 'viewer'` | `viewer` / `manager` / `admin` |
| `display_name` | `VARCHAR(255)` | Nullable |

### Table: `search_analytics`
| Column | Type | Notes |
|--------|------|-------|
| `query_string` | `VARCHAR(500) PK` | Lowercased + trimmed |
| `search_count` | `INTEGER DEFAULT 1` | Incremented via UPSERT |
| `last_searched` | `TIMESTAMPTZ DEFAULT now()` | |
| `resolved` | `BOOLEAN DEFAULT false` | Admin marks true when anime is added |

---

## 🔒 RLS Policies

Always generate these policies when creating or modifying tables:

```sql
-- animes: public read, admin write
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_animes" ON animes FOR SELECT USING (true);
CREATE POLICY "admin_write_animes" ON animes FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- fansub_groups: public read, manager updates own, admin all
ALTER TABLE fansub_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_fansubs" ON fansub_groups FOR SELECT USING (true);
CREATE POLICY "manager_update_own" ON fansub_groups FOR UPDATE
  USING (manager_uid = auth.uid());
CREATE POLICY "admin_all_fansubs" ON fansub_groups FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- translations: public read, manager writes for their group, admin all
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_translations" ON translations FOR SELECT USING (true);
CREATE POLICY "manager_write_translations" ON translations FOR ALL
  USING (
    (SELECT manager_uid FROM fansub_groups WHERE id = translations.fansub_id) = auth.uid()
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

---

## ⚡ Supabase RPC Functions

Always call these via `supabase.rpc()`. Never reimplement their logic in TypeScript.

### Fuzzy Search
```sql
-- Searches title_he, title_en, title_romaji with trigram similarity
CREATE OR REPLACE FUNCTION search_animes(search_query TEXT)
RETURNS TABLE (
  id UUID, title_he TEXT, title_en TEXT,
  cover_image_url TEXT, genres TEXT[], similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title_he, a.title_en, a.cover_image_url, a.genres,
    GREATEST(
      similarity(a.title_he,    search_query),
      similarity(a.title_en,    search_query),
      COALESCE(similarity(a.title_romaji, search_query), 0)
    ) AS sim
  FROM animes a
  WHERE a.title_he % search_query
     OR a.title_en % search_query
     OR a.title_romaji % search_query
  ORDER BY sim DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Randomizer
```sql
CREATE OR REPLACE FUNCTION get_random_anime()
RETURNS TABLE (id UUID, title_he TEXT, title_en TEXT)
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title_he, a.title_en
  FROM animes a
  ORDER BY RANDOM() LIMIT 1;
END;
$$ LANGUAGE plpgsql VOLATILE;
```

---

## 🧩 Component Patterns

### Server vs Client
- Default to **Server Components**. Only add `"use client"` when the component uses `useState`, `useEffect`, `useRouter`, event handlers, or browser APIs.
- Never fetch data inside a Client Component directly — pass data as props from the Server Component parent.

### Data Fetching Pattern
```tsx
// ✅ Server Component — fetch real data
export default async function AnimePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: anime, error } = await supabase
    .from('animes')
    .select(`*, translations(*, fansub_groups(*))`)
    .eq('id', params.id)
    .single()

  if (error || !anime) notFound()
  return <AnimeDetail anime={anime} />
}
```

### Empty State Pattern
```tsx
// ✅ Always use EmptyState — never fake data
export default function AnimeGrid({ animes }: { animes: Anime[] }) {
  if (animes.length === 0) {
    return <EmptyState message="No anime titles found." />
  }
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{...}</div>
}
```

### Server Action Pattern
```tsx
"use server"
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  anime_id: z.string().uuid(),
  fansub_id: z.string().uuid(),
  status: z.enum(['ongoing', 'completed', 'dropped']),
  platform: z.enum(['website', 'telegram', 'discord', 'youtube']),
  direct_link: z.string().url(),
})

export async function upsertTranslation(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { error } = await supabase.from('translations').upsert(parsed.data)
  if (error) throw new Error(error.message)

  revalidatePath(`/anime/${parsed.data.anime_id}`)
  revalidatePath('/dashboard')
}
```

---

## 🌐 API Route Pattern

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { logSearchQuery } from '@/actions/analytics'

const schema = z.object({ query: z.string().min(2).max(200) })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid query' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('search_animes', {
    search_query: parsed.data.query.toLowerCase().trim()
  })

  if (error) {
    console.error('[search] Supabase error:', error) // Log server-side only
    return NextResponse.json({ data: null, error: 'Search failed' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    await logSearchQuery(parsed.data.query) // Analytics: track unsatisfied searches
  }

  return NextResponse.json({ data, error: null })
}
// TODO: Add Upstash Redis rate limiting (max 30 req/min per IP)
```

---

## 🌍 RTL & Hebrew UI Rules

- The root `<html>` tag must have `dir="rtl"` and `lang="he"`
- All UI text facing the user must be in Hebrew
- Error messages, empty states, loading text — all Hebrew
- Code comments can be in English
- Use Tailwind's `rtl:` prefix when directional overrides are needed

---

## 🎨 Styling Rules

- Tailwind utility classes only — no inline styles, no CSS modules
- All components must support `dark:` variants
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Use `next/image` for all images — never a raw `<img>` tag
- Missing cover images → show a local fallback SVG at `public/images/no-cover.svg`

---

## 🚀 Vercel & Environment Rules

`.env.example` (committed to git, empty values):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

- `NEXT_PUBLIC_*` variables are safe for Client Components
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never in client files
- After every mutation: call `revalidatePath(route)` for affected pages
- Use `export const dynamic = 'force-dynamic'` only when truly needed

---

## ✅ Definition of Done

Before marking any task complete, verify all of the following:

- [ ] Data comes from Supabase — no hardcoded or fake values anywhere
- [ ] Empty state shown when data array is empty
- [ ] TypeScript: zero `any`, all types from `database.types.ts`
- [ ] Zod validates all inputs before DB calls
- [ ] Auth checked at the top of every mutation
- [ ] RLS not bypassed — no service role used where anon/user client suffices
- [ ] `revalidatePath` called after every write
- [ ] Works correctly in both light and dark mode
- [ ] Hebrew text on all user-facing strings
- [ ] RTL layout correct on all screen sizes
- [ ] Loading skeleton shown during data fetch
- [ ] Error boundary handles failed fetches gracefully

---

## ❌ Anti-Patterns — Never Do These

```tsx
// ❌ Fake data
const MOCK_ANIMES = [{ id: '1', title_he: 'נארוטו' }]

// ❌ any type
const { data }: { data: any } = await supabase.from('animes').select()

// ❌ Service key in client
"use client"
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ❌ Silent error handling
const { data } = await supabase.from('animes').select()
// error ignored

// ❌ Fetching in client component
"use client"
export default function Page() {
  const [data, setData] = useState([])
  useEffect(() => { fetch('/api/animes').then(...).then(setData) }, [])
}

// ❌ Raw <img> tag
<img src={anime.cover_image_url} alt={anime.title_he} />

// ❌ Disabled RLS
ALTER TABLE animes DISABLE ROW LEVEL SECURITY;
```
