# Virtual Agent Skills — Anime Fansub Locator

These three agents represent distinct domains of expertise. When building a feature, identify which agent's logic applies and follow its rules.

---

## Agent 1 — The Search Architect

> *"Every query answered. Every fansub found."*

**Domain:** Data indexing, search logic, external API integration, and fansub registry.

### Responsibilities
- Design and maintain the **fansub index** — a structured registry mapping anime MAL IDs to available Hebrew fansub groups and their project status.
- Implement search flows: query → Jikan API for metadata → match against local fansub index → rank results.
- Handle **debounced live search** with a 300ms delay before firing requests.
- Apply **request queuing** for Jikan to stay within the 3 req/sec rate limit.
- Cache all Jikan responses with appropriate TTLs (anime metadata: 24h, currently airing: 1h).

### Data Model

```typescript
// A single fansub group's project entry
interface FansubProject {
  malId: number;           // MyAnimeList anime/manga ID
  title: string;           // Original title (Japanese/English)
  titleHebrew?: string;    // Localized Hebrew title if available
  fansubGroup: string;     // e.g., "FanSub-IL", "AnimeHebrewSubs"
  type: 'anime' | 'manga';
  status: 'completed' | 'ongoing' | 'dropped' | 'planned';
  episodesCovered?: string; // e.g., "1-24" or "all"
  releaseUrl?: string;     // Where to find the fansub
  lastUpdated: string;     // ISO date string
}
```

### Core Logic Patterns

```typescript
// Debounced search hook signature
function useAnimeSearch(query: string): {
  results: AnimeSearchResult[];
  isLoading: boolean;
  hasLocalFansub: boolean[];
}

// Fansub index lookup — O(1) via Map
function lookupFansubs(malId: number): FansubProject[]

// Search result ranking: exact title match > partial > fansub availability bonus
function rankResults(results: JikanAnime[], fansubIndex: Map<number, FansubProject[]>): RankedResult[]
```

### Rules
- Always normalize queries: trim whitespace, lowercase for matching, preserve original for display.
- If Jikan returns 0 results, log a **Missing Hit** event immediately (delegate to Stats Guru).
- Never block the UI — all fetches go through loading states.
- Support searching by: title (Hebrew transliteration + English + Japanese romaji), genre, studio, season/year.

### Supabase Integration

**Fansub Index — Supabase Table, Not JSON**
The fansub index lives in the `fansub_projects` Supabase table. Replace the in-memory `Map` with a batch PostgREST query — still O(1) per MAL ID after the single round-trip fetch.

```typescript
// Batch lookup: one query for all malIds in a result set
async function lookupFansubsByMalIds(malIds: number[]): Promise<Map<number, FansubProject[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fansub_projects')
    .select('mal_id, title, title_hebrew, fansub_group, status, episodes_covered, release_url, last_updated')
    .in('mal_id', malIds)     // single query, not N queries
  if (error) throw new Error(error.message)
  return data.reduce((map, project) => {
    map.set(project.mal_id, [...(map.get(project.mal_id) ?? []), project])
    return map
  }, new Map<number, FansubProject[]>())
}
```

**Full-Text Search for Hebrew Titles (`tsvector`)**
When `isHebrew(query)` is true, run a parallel Supabase FTS query against the `title_hebrew` column in addition to the Jikan search.

```typescript
async function searchFansubsByHebrewTitle(query: string): Promise<FansubProject[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('fansub_projects')
    .select('mal_id, title, title_hebrew, status, fansub_group')
    .textSearch('fts', query, {
      type: 'websearch',
      config: 'simple',   // 'simple' — no stemming; correct for Hebrew
    })
    .limit(10)
  return data ?? []
}
```

- The `fts` column is a generated `tsvector` combining `title`, `title_hebrew`, and `genres` (created via Supabase migration).
- Fall back to `.ilike('title_hebrew', `%${query}%`)` if FTS returns zero rows.
- Always run Jikan and Supabase FTS **in parallel** via `Promise.all` — never sequentially.

**Updated Search Flow**
```
User query
  ↓
isHebrew(query)?
  ├── YES → [Supabase FTS on title_hebrew] + [Jikan search] in parallel
  └── NO  → Jikan search → extract malIds → Supabase .in() batch lookup
  ↓
Merge, deduplicate by malId, rank results
  ↓
No fansub match found? → delegate MissingHit to Stats Guru
```

---

## Agent 2 — The Stats Guru

> *"What fans want but can't find — that's the data that matters."*

**Domain:** Demand tracking, missing hit analytics, fansub prioritization signals, and dashboard statistics.

### Responsibilities
- **Log every search** that produces zero fansub results as a "Missing Hit" event.
- Aggregate Missing Hits into a ranked demand list: which anime/manga do Israeli fans search for most without finding Hebrew subs?
- Surface this data to fansub groups via the **Fansub Dashboard** so they can prioritize their limited translation capacity.
- Track trends over time (daily/weekly/monthly).

### Missing Hit Event Schema

```typescript
interface MissingHitEvent {
  id: string;              // uuid
  query: string;           // The raw search string
  normalizedQuery: string; // Lowercased, trimmed
  resolvedMalId?: number;  // If Jikan found a match but no fansub exists
  resolvedTitle?: string;  // Canonical title from Jikan
  resolvedType?: 'anime' | 'manga';
  timestamp: string;       // ISO 8601
  sessionId: string;       // Anonymous session identifier (no PII)
  userLocale: string;      // e.g., "he-IL"
}

// Aggregated demand entry shown in dashboard
interface DemandEntry {
  malId: number;
  title: string;
  titleHebrew?: string;
  coverImage: string;
  searchCount: number;     // Total missing hit count
  weeklyTrend: number;     // % change vs previous week
  genres: string[];
  score: number;           // MAL score (1-10)
  episodes?: number;
  status: 'airing' | 'finished' | 'upcoming';
}
```

### Core Logic Patterns

```typescript
// Called by Search Architect when results = 0 fansub matches
async function logMissingHit(event: Omit<MissingHitEvent, 'id' | 'timestamp'>): Promise<void>

// Returns top N demanded content, sorted by searchCount desc
async function getTopDemands(limit: number, period: '7d' | '30d' | 'all'): Promise<DemandEntry[]>

// Calculate weekly trend delta for a given malId
function calculateTrend(malId: number, events: MissingHitEvent[]): number
```

### Dashboard Metrics to Expose
1. **Total missing hits this week** — headline number
2. **Top 10 most-wanted** — ranked list with covers, scores, and trend arrows
3. **Most-searched genres** — tag cloud / bar chart
4. **Hot right now** — currently-airing shows with zero Hebrew coverage
5. **Fansub coverage rate** — `(shows with fansub / total searched shows) * 100`

### Rules
- Events are **anonymous** — no user tracking, no IPs stored, no fingerprinting.
- Deduplicate: same `sessionId` + same `normalizedQuery` within 1 hour = single event (enforced by DB check, not application memory).
- Write each qualifying event directly to Supabase — no in-memory batching needed; deduplication is handled server-side.
- Never expose raw event logs to the public — only aggregated demand data from `demand_cache`.

### Supabase Upsert Logic

**Why Upsert over Insert?**
Two tables carry the stats burden:
1. `search_events` — append-only event log (raw data, deduplicated).
2. `demand_cache` — pre-aggregated demand counts, upserted atomically per event so the dashboard never runs expensive aggregation queries at read time.

**Database Schema**
```sql
-- Append-only event log
create table search_events (
  id            uuid primary key default gen_random_uuid(),
  query         text not null,
  normalized_query text not null,
  resolved_mal_id  integer,
  resolved_title   text,
  resolved_type    text check (resolved_type in ('anime', 'manga')),
  session_id    text not null,
  user_locale   text default 'he-IL',
  created_at    timestamptz default now()
);

-- Pre-aggregated demand: upserted on every qualifying event
create table demand_cache (
  mal_id        integer primary key,
  title         text not null,
  title_hebrew  text,
  cover_image   text,
  search_count  integer default 0,
  last_searched_at timestamptz default now(),
  genres        text[],
  mal_score     numeric(4,2),
  updated_at    timestamptz default now()
);

-- Atomic increment function — avoids race conditions
create or replace function increment_demand_count(p_mal_id integer)
returns void language sql as $$
  update demand_cache
  set search_count = search_count + 1,
      updated_at   = now()
  where mal_id = p_mal_id;
$$;
```

**Upsert Pattern — Server Action**
```typescript
// src/actions/log-missing-hit.ts  ('use server' at top of file)
export async function logMissingHit(payload: MissingHitPayload): Promise<void> {
  const supabase = createClient()
  const normalized = normalizeQuery(payload.query)

  // Step 1: Deduplicate — same session + same query within the last hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await supabase
    .from('search_events')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', payload.sessionId)
    .eq('normalized_query', normalized)
    .gte('created_at', oneHourAgo)
  if ((count ?? 0) > 0) return  // within dedup window — skip silently

  // Step 2: Insert raw event
  await supabase.from('search_events').insert({
    query: payload.query,
    normalized_query: normalized,
    resolved_mal_id: payload.resolvedMalId,
    resolved_title: payload.resolvedTitle,
    resolved_type: payload.resolvedType,
    session_id: payload.sessionId,
    user_locale: payload.userLocale ?? 'he-IL',
  })

  // Step 3: Upsert demand_cache seed row (INSERT if new, no-op on count column)
  if (payload.resolvedMalId) {
    await supabase.from('demand_cache').upsert(
      {
        mal_id: payload.resolvedMalId,
        title: payload.resolvedTitle ?? '',
        title_hebrew: payload.resolvedTitleHebrew,
        cover_image: payload.coverImage ?? '',
        search_count: 0,                // seed; real count set by RPC below
        genres: payload.genres ?? [],
        mal_score: payload.malScore,
      },
      { onConflict: 'mal_id', ignoreDuplicates: true }  // only insert if new row
    )
    // Step 4: Atomic increment via PostgreSQL function — no race conditions
    await supabase.rpc('increment_demand_count', { p_mal_id: payload.resolvedMalId })
  }
}
```

**Reading Demand Data**
```typescript
// src/actions/get-demand-stats.ts
export async function getTopDemands(limit = 20, period: '7d' | '30d' | 'all' = '30d'): Promise<DemandEntry[]> {
  const supabase = createClient()
  let query = supabase
    .from('demand_cache')
    .select('*')
    .order('search_count', { ascending: false })
    .limit(limit)

  if (period !== 'all') {
    const days = period === '7d' ? 7 : 30
    query = query.gte('last_searched_at', new Date(Date.now() - days * 86_400_000).toISOString())
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}
```

**Key Rules (Supabase-Specific)**
- **No JSON file writing** — `data/missing-hits.json` is retired. Supabase is the single source of truth.
- **Never increment in application code** after a read — always use `increment_demand_count` RPC to prevent race conditions under concurrent traffic.
- **`demand_cache` is pre-aggregated** — the dashboard `SELECT` is a simple ordered read, not a GROUP BY aggregation.
- **Use `ignoreDuplicates: true`** on the upsert seed row so a second event for the same `mal_id` only triggers the RPC increment, not a full row overwrite.

---

## Agent 3 — The UX Artist

> *"An interface worthy of the art it celebrates."*

**Domain:** Visual design, component aesthetics, animation, accessibility, Hebrew RTL UI, and Otaku cultural resonance.

### Responsibilities
- Define and maintain the **visual language** of the platform — it should feel like a premium anime streaming site, not a generic web app.
- Ensure every component is **RTL-first** for Hebrew while gracefully handling LTR anime title content.
- Implement micro-animations that feel fluid and intentional, not gimmicky.
- Enforce **dark-mode by default** with an optional light mode toggle.

### Design Tokens (Tailwind CSS Variables)

```css
/* In globals.css — the color soul of the platform */
:root {
  --background: 222 47% 5%;       /* Deep navy-black */
  --foreground: 210 40% 98%;      /* Near-white text */
  --primary: 264 80% 65%;         /* Anime purple */
  --primary-glow: 264 100% 75%;   /* Glowing purple for accents */
  --secondary: 190 80% 50%;       /* Cyan for contrast */
  --muted: 217 33% 17%;           /* Muted card backgrounds */
  --border: 217 33% 22%;          /* Subtle borders */
  --card: 222 47% 8%;             /* Card background */
  --card-glass: rgba(255,255,255,0.04); /* Glassmorphism */
}
```

### Component Aesthetic Rules

**Cards**
- Anime series cards use `backdrop-blur` glassmorphism.
- Hover state: subtle `scale-[1.02]` transform + border glow in `--primary`.
- Show: cover art, Hebrew title (if available), original title, fansub badge OR "Missing" badge.

**Search Bar**
- Full-width, centered hero placement on home page.
- Animated placeholder cycles through Hebrew and English prompts.
- Results dropdown with cover thumbnails and availability badges.
- "חיפוש..." placeholder in Hebrew, auto-switches to English if Latin chars detected.

**Badges & Tags**
- `completed` → green shimmer badge: `"מתורגם ✓"`
- `ongoing` → blue pulse badge: `"בתרגום..."`
- `missing` → red/orange subtle badge: `"טרם תורגם"`
- `planned` → yellow badge: `"מתוכנן"`

**Typography Scale**
- Page titles: `text-4xl font-bold tracking-tight` (Heebo for Hebrew)
- Section headings: `text-2xl font-semibold`
- Body: `text-base` / `text-sm leading-relaxed`
- Anime titles (Japanese/English): always `dir="ltr"` inline, italic, slightly muted

**RTL Patterns**
```tsx
// Correct — search icon on logical start (right in RTL)
<div className="relative">
  <Search className="absolute start-3 top-1/2 -translate-y-1/2" />
  <input className="ps-10 pe-4 w-full" dir="auto" />
</div>

// Correct — flex row with RTL reversal
<div className="flex flex-row-reverse items-center gap-3 rtl:flex-row">
```

**Animations**
- Use `transition-all duration-200 ease-out` as the default transition.
- Skeleton loaders: animated `bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%] animate-shimmer`.
- Page transitions: fade-in via Tailwind `animate-in fade-in-0 slide-in-from-bottom-4`.
- No animation on `prefers-reduced-motion`.

### Page-Level Vision

| Page         | Vibe                                                      |
|--------------|-----------------------------------------------------------|
| Home         | Cinematic hero, live search bar, trending demand preview  |
| Search Results | Grid of anime cards with fansub status badges           |
| Fansub Page  | Profile page for a fansub group — their projects, stats   |
| Dashboard    | Analytics — demand charts, missing hits, coverage rate    |
| Manga Section| Same pattern, distinct accent color (amber instead of purple) |
