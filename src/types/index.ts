// ─── Jikan / MyAnimeList Types ────────────────────────────────────────────────

export interface JikanImage {
  jpg: {
    image_url: string
    small_image_url: string
    large_image_url: string
  }
  webp: {
    image_url: string
    small_image_url: string
    large_image_url: string
  }
}

export interface JikanGenre {
  mal_id: number
  type: string
  name: string
  url: string
}

export interface JikanAnime {
  mal_id: number
  title: string
  title_english: string | null
  title_japanese: string | null
  images: JikanImage
  synopsis: string | null
  score: number | null
  scored_by: number | null
  rank: number | null
  episodes: number | null
  status: 'Finished Airing' | 'Currently Airing' | 'Not yet aired'
  airing: boolean
  genres: JikanGenre[]
  type: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music' | null
  year: number | null
  season: 'spring' | 'summer' | 'fall' | 'winter' | null
}

export interface JikanManga {
  mal_id: number
  title: string
  title_english: string | null
  title_japanese: string | null
  images: JikanImage
  synopsis: string | null
  score: number | null
  chapters: number | null
  volumes: number | null
  status: 'Finished' | 'Publishing' | 'On Hiatus' | 'Discontinued' | 'Not yet published'
  publishing: boolean
  genres: JikanGenre[]
  type: 'Manga' | 'Light Novel' | 'One-shot' | 'Doujinshi' | 'Manhwa' | 'Manhua' | null
  authors: Array<{ mal_id: number; type: string; name: string; url: string }>
}

export interface JikanSearchResponse<T> {
  data: T[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: { count: number; total: number; per_page: number }
  }
}

// ─── Fansub Index Types ────────────────────────────────────────────────────────

export type FansubStatus = 'completed' | 'ongoing' | 'dropped' | 'planned'
export type ContentType = 'anime' | 'manga'

export interface FansubProject {
  malId: number
  title: string
  titleHebrew?: string
  fansubGroup: string
  type: ContentType
  status: FansubStatus
  episodesCovered?: string
  releaseUrl?: string
  lastUpdated: string
}

// ─── Search Types ─────────────────────────────────────────────────────────────

export interface RankedResult {
  anime: JikanAnime
  fansubs: FansubProject[]
  hasFansub: boolean
  relevanceScore: number
}

export interface SearchIntent {
  normalizedQuery: string
  originalQuery: string
  detectedLanguage: 'hebrew' | 'english' | 'japanese' | 'unknown'
}

// ─── Missing Hit / Demand Types ───────────────────────────────────────────────

export interface MissingHitEvent {
  id: string
  query: string
  normalizedQuery: string
  resolvedMalId?: number
  resolvedTitle?: string
  resolvedType?: ContentType
  timestamp: string
  sessionId: string
  userLocale: string
}

export interface DemandEntry {
  malId: number
  title: string
  titleHebrew?: string
  coverImage: string
  searchCount: number
  weeklyTrend: number
  genres: string[]
  score: number | null
  episodes: number | null
  status: 'airing' | 'finished' | 'upcoming'
}
