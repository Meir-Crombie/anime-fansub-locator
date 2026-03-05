# Project Map — Anime Fansub Locator & Demand Tracker

> Living document. Update status as features are built.
> Legend: `[ ]` Not started · `[~]` In progress · `[x]` Done

---

## Phase 0 — Brain Infrastructure

| Status | Artifact | Description |
|--------|----------|-------------|
| `[x]` | `.github/copilot-instructions.md` | AI architect role, tech stack rules, RTL & domain knowledge |
| `[x]` | `dev-docs/skills.md` | 3 virtual agent specs (Search Architect, Stats Guru, UX Artist) |
| `[x]` | `prompts/manifesto.md` | 20+ vibe prompts for one-sentence feature generation |
| `[x]` | `project-map.md` | This file — progress tracker |

---

## Phase 1 — Foundations

| Status | File | Description |
|--------|------|-------------|
| `[x]` | `package.json` | Dependencies: Next.js 14, TypeScript, Tailwind, Shadcn, Lucide |
| `[x]` | `tsconfig.json` | TypeScript strict mode, path aliases (`@/*`) |
| `[x]` | `next.config.ts` | Image domains (CDN MAL), typed routes |
| `[x]` | `tailwind.config.ts` | Design tokens, custom animations (shimmer, fade-in, pulse-glow) |
| `[x]` | `postcss.config.js` | Tailwind + autoprefixer |
| `[x]` | `.gitignore` | Excludes .next, node_modules, .env.local, missing-hits.json |
| `[x]` | `.env.example` | Template for local environment variables |
| `[x]` | `src/app/layout.tsx` | Root layout: RTL, Hebrew/Inter fonts, dark mode class |
| `[x]` | `src/app/globals.css` | CSS variables, glassmorphism, shimmer, anime-title utility |
| `[x]` | `src/app/page.tsx` | Home page skeleton: hero, search bar, stats strip |
| `[x]` | `src/lib/utils.ts` | `cn()`, `formatNumber()`, `formatDate()`, `normalizeQuery()`, `isHebrew()` |
| `[x]` | `src/types/index.ts` | All TypeScript interfaces: Jikan, Fansub, Search, MissingHit |
| `[x]` | `data/fansub-index.json` | Seeded with 10 real anime fansub entries |

---

## Phase 1.5 — Infrastructure Alignment ✓

> Upgraded the project brain to be Supabase & Vercel-native. No contradictions remain between general rules and stack-specific implementation.

| Status | Artifact | Change |
|--------|----------|--------|
| `[x]` | `.github/copilot-instructions.md` | Added Supabase to tech stack table; added 3 new sections: Supabase Patterns, Route Handlers & Middleware, Vercel Deployment & Caching |
| `[x]` | `dev-docs/skills.md` — Search Architect | Added Supabase PostgREST batch lookup, Full-Text Search on `fts` tsvector column, and updated dual-path search flow |
| `[x]` | `dev-docs/skills.md` — Stats Guru | Replaced JSON batch-flush logic with Supabase Upsert pattern; added atomic RPC increment, DB schema, and dedup-via-query |
| `[x]` | `project-map.md` | Superseded JSON file storage decision; updated Phase 4 to Supabase tables; updated Architecture Decisions Log |

---

## Phase 2 — Search & Stats Logic ← NEXT MILESTONE

| Status | File | Description |
|--------|------|-------------|
| `[ ]` | `src/lib/jikan-client.ts` | Typed Jikan API client with rate limiting & cache |
| `[ ]` | `src/lib/fansub-index.ts` | Supabase batch lookup + `lookupFansubsByMalIds()` returning `Map<malId, FansubProject[]>` |
| `[ ]` | `src/hooks/use-anime-search.ts` | Debounced search hook with fansub cross-reference |
| `[ ]` | `src/app/api/search/route.ts` | API route: Jikan → fansub index → ranked results |
| `[ ]` | `src/app/search/[query]/page.tsx` | Search results page (server component) |

**Vibe prompts to use:** `SL-01`, `SL-02`, `SL-03`, `SL-04`, `SL-05`

---

## Phase 3 — Components Library

| Status | File | Description |
|--------|------|-------------|
| `[ ]` | `src/components/anime-card.tsx` | Anime card with cover, badges, hover overlay |
| `[ ]` | `src/components/fansub-badge.tsx` | Status badge system (5 states, Hebrew labels) |
| `[ ]` | `src/components/search-bar.tsx` | Animated live search with dropdown results |
| `[ ]` | `src/components/skeletons.tsx` | Shimmer skeleton variants |
| `[ ]` | `src/components/navbar.tsx` | RTL nav with Hebrew links, theme toggle |

**Vibe prompts to use:** `CI-01`, `CI-02`, `CI-03`, `CI-04`

---

## Phase 4 — Missing Hit Tracking

| Status | File | Description |
|--------|------|-------------|
| `[ ]` | `src/actions/log-missing-hit.ts` | Server action: deduplicate, insert event, upsert demand_cache + RPC increment |
| `[ ]` | `src/actions/get-demand-stats.ts` | Server action: read from demand_cache, return DemandEntry[] |
| `[ ]` | `supabase/migrations/001_search_events.sql` | Create `search_events` table with RLS |
| `[ ]` | `supabase/migrations/002_demand_cache.sql` | Create `demand_cache` table + `increment_demand_count` RPC |

**Vibe prompts to use:** `CI-05`, `DB-05`

---

## Phase 5 — Home Page (Complete)

| Status | File | Description |
|--------|------|-------------|
| `[ ]` | Upgrade `src/app/page.tsx` | Wire up live search + trending demand + airing section |

**Vibe prompts to use:** `HP-01`, `HP-02`, `HP-03`, `HP-04`, `HP-05`, `COMBO-01`

---

## Phase 6 — Fansub Dashboard

| Status | File | Description |
|--------|------|-------------|
| `[ ]` | `src/app/dashboard/layout.tsx` | Dashboard shell with sidebar nav |
| `[ ]` | `src/app/dashboard/page.tsx` | Coverage stats + KPI cards |
| `[ ]` | `src/app/dashboard/demand/page.tsx` | Top demand table |
| `[ ]` | `src/app/dashboard/projects/page.tsx` | Projects CRUD manager |
| `[ ]` | `src/app/dashboard/feed/page.tsx` | Live missing hits feed |

**Vibe prompts to use:** `DB-01`, `DB-02`, `DB-03`, `DB-04`, `DB-05`, `COMBO-03`

---

## Phase 7 — Fansub Group Pages

| Status | File | Description |
|--------|------|-------------|
| `[ ]` | `src/app/fansubs/page.tsx` | Directory of all fansub groups |
| `[ ]` | `src/app/fansubs/[slug]/page.tsx` | Individual fansub group profile |

---

## Architecture Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-05 | App Router (Next.js 14) | Server components + streaming for performance |
| 2026-03-05 | ~~JSON file storage for MVP~~ → **Supabase (PostgreSQL)** | Supabase provides RLS, atomic upserts, FTS, and Auth with zero infrastructure overhead — the right default from day one |
| 2026-03-05 | Jikan API (no auth required) | Free MAL proxy, sufficient for MVP traffic |
| 2026-03-05 | RTL-first with `dir="rtl"` on `<html>` | Hebrew is primary UI language |
| 2026-03-05 | Dark mode default | Target audience (Otaku) preference; aesthetic match |
| 2026-03-05 | Server Actions for mutations | Aligned with Next.js App Router best practices; avoids client-side POST wiring; enables `revalidateTag()` after writes |
| 2026-03-05 | `@supabase/ssr` (server) + `createBrowserClient` (client) | Correct session management for SSR; prevents JWT mismatch in Middleware |
| 2026-03-05 | Tag-based cache revalidation on Vercel | More granular than path-based; one tag invalidates multiple pages sharing the same data |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local

# Run development server
npm run dev

# Type-check
npm run type-check
```

App runs at `http://localhost:3000`

---

## Current Focus — Phase 2: Search & Stats Logic

**Milestone goal:** A fully wired search flow + anonymous demand logging, all backed by Supabase.

**Order of attack:**
1. Set up Supabase project → copy `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`
2. Create `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`
3. Run Supabase migrations: `001_search_events.sql` → `002_demand_cache.sql`
4. Fire `SL-05` → build the Jikan API client with rate limiting + tag caching
5. Fire `SL-03` → build `fansub-index.ts` using Supabase `.in()` batch lookup
6. Fire `SL-01` → wire `useAnimeSearch` hook with the dual Hebrew/English search flow
7. Fire `CI-05` → implement `logMissingHit` server action with Supabase upsert
8. Fire `SL-02` → build the Search Results page end-to-end
