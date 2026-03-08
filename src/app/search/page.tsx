import { createServerClient } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string
  title_he: string
  title_en: string
  cover_image_url: string | null
  genres: string[]
  similarity_score: number
  title_romaji: string | null
}

interface SearchPageProps {
  searchParams: { q?: string }
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = searchParams.q ?? ''
  return {
    title: query ? `חיפוש: ${query} | Fansub Hub` : 'חיפוש | Fansub Hub',
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() ?? ''

  if (query.length < 2) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">חיפוש אנימה</h1>
        <p className="text-muted-foreground">הכנס לפחות 2 תווים לחיפוש.</p>
      </main>
    )
  }

  const supabase = createServerClient()

  // Try RPC first, fall back to ILIKE if unavailable
  let results: SearchResult[] = []

  const { data: rpcData, error: rpcError } = await supabase.rpc('search_animes', {
    search_query: query.toLowerCase(),
  })

  if (!rpcError && rpcData) {
    results = rpcData as SearchResult[]
  } else {
    // Fallback: ILIKE substring search
    const pattern = `%${query.toLowerCase()}%`
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('animes')
      .select('id, title_he, title_en, title_romaji, cover_image_url, genres')
      .or(`title_he.ilike.${pattern},title_en.ilike.${pattern},title_romaji.ilike.${pattern}`)
      .limit(20)

    if (fallbackError) {
      return (
        <main className="container mx-auto max-w-5xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">שגיאה בחיפוש</h1>
          <p className="text-muted-foreground">אירעה שגיאה. נסה שוב מאוחר יותר.</p>
        </main>
      )
    }

    results = (fallbackData ?? []).map((a) => ({
      id: a.id,
      title_he: a.title_he,
      title_en: a.title_en,
      title_romaji: a.title_romaji,
      cover_image_url: a.cover_image_url,
      genres: a.genres ?? [],
      similarity_score: 1,
    }))
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          תוצאות חיפוש עבור: &ldquo;{query}&rdquo;
        </h1>
        <p className="text-muted-foreground mt-1">
          {results.length > 0
            ? `נמצאו ${results.length} תוצאות`
            : 'לא נמצאו תוצאות'}
        </p>
      </div>
      <AnimeGrid animes={results} />
    </main>
  )
}
