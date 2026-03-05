import { createServerClient } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import type { Metadata } from 'next'

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
  const { data, error } = await supabase.rpc('search_animes', {
    search_query: query.toLowerCase(),
  })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">שגיאה בחיפוש</h1>
        <p className="text-muted-foreground">אירעה שגיאה. נסה שוב מאוחר יותר.</p>
      </main>
    )
  }

  const results = (data ?? []) as SearchResult[]

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
