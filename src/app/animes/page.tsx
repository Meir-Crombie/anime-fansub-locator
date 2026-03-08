import { createServerClient } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import AnimesFilter from './AnimesFilter'
import type { Metadata } from 'next'
import type { AnimeCardData } from '@/components/AnimeCard'

export const metadata: Metadata = {
  title: 'כל האנימות | Fansub Hub',
  description: 'כל האנימות עם תרגום לעברית',
}

export const dynamic = 'force-dynamic'

interface AnimesPageProps {
  searchParams: { q?: string; genre?: string; length?: string }
}

export default async function AnimesPage({ searchParams }: AnimesPageProps) {
  const supabase = createServerClient()
  const query = searchParams.q?.trim() ?? ''
  const genre = searchParams.genre?.trim() ?? ''
  const length = searchParams.length?.trim() ?? ''

  let dbQuery = supabase
    .from('animes')
    .select('id, title_he, title_en, cover_image_url, genres')
    .order('created_at', { ascending: false })

  // Apply search filter
  if (query.length >= 2) {
    const pattern = `%${query}%`
    dbQuery = dbQuery.or(
      `title_he.ilike.${pattern},title_en.ilike.${pattern},title_romaji.ilike.${pattern}`
    )
  }

  // Apply genre filter
  if (genre) {
    const genres = genre.split(',').filter(Boolean)
    for (const g of genres) {
      dbQuery = dbQuery.contains('genres', [g])
    }
  }

  // Apply episode length filter (total_episodes column added via migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalQuery = dbQuery as any
  if (length === 'short') {
    finalQuery = finalQuery.gte('total_episodes', 1).lte('total_episodes', 12)
  } else if (length === 'medium') {
    finalQuery = finalQuery.gte('total_episodes', 13).lte('total_episodes', 25)
  } else if (length === 'long') {
    finalQuery = finalQuery.gte('total_episodes', 26)
  }

  const { data, error } = await finalQuery.limit(100)

  if (error) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">שגיאה בטעינת האנימות</h1>
        <p className="text-muted-foreground">אירעה שגיאה. נסה שוב מאוחר יותר.</p>
      </main>
    )
  }

  interface AnimeRow {
    id: string
    title_he: string
    title_en: string
    cover_image_url: string | null
    genres: string[] | null
  }

  const animes: AnimeCardData[] = ((data ?? []) as AnimeRow[]).map((a) => ({
    id: a.id,
    title_he: a.title_he,
    title_en: a.title_en,
    cover_image_url: a.cover_image_url,
    genres: a.genres ?? [],
  }))

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">כל האנימות</h1>
        <p className="text-muted-foreground mt-1">
          {animes.length > 0
            ? `${animes.length} אנימות במאגר`
            : 'אין אנימות במאגר עדיין'}
        </p>
      </div>

      <AnimesFilter initialQuery={query} initialGenre={genre} initialLength={length} />

      {query && animes.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          לא מצאנו את האנימה שחיפשת, אבל הנה כל האנימות שלנו:
        </p>
      )}

      <AnimeGrid animes={animes} />
    </main>
  )
}
