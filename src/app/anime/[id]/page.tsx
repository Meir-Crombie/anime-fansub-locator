import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import TranslationList from '@/components/TranslationList'
import type { Metadata } from 'next'

interface AnimePageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: AnimePageProps): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: anime } = await supabase
    .from('animes')
    .select('title_he, title_en, synopsis')
    .eq('id', params.id)
    .single()

  if (!anime) return { title: 'אנימה לא נמצאה' }

  return {
    title: `${anime.title_he} | Fansub Hub`,
    description: anime.synopsis ?? `${anime.title_he} — ${anime.title_en}`,
  }
}

export default async function AnimePage({ params }: AnimePageProps) {
  const supabase = createServerClient()

  const { data: anime, error } = await supabase
    .from('animes')
    .select(`
      *,
      translations(
        *,
        fansub_groups(*)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !anime) notFound()

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full max-w-[250px] mx-auto md:mx-0 overflow-hidden rounded-xl border bg-muted">
          {anime.cover_image_url ? (
            <Image
              src={anime.cover_image_url}
              alt={anime.title_he}
              fill
              sizes="250px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              אין תמונה
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{anime.title_he}</h1>
            <p className="text-lg text-muted-foreground anime-title mt-1">
              {anime.title_en}
            </p>
            {anime.title_romaji && (
              <p className="text-sm text-muted-foreground anime-title">
                {anime.title_romaji}
              </p>
            )}
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((genre: string) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <div>
              <h2 className="text-lg font-semibold mb-2">תקציר</h2>
              <p className="text-muted-foreground leading-relaxed">
                {anime.synopsis}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Translations */}
      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold">תרגומים זמינים</h2>
        <TranslationList translations={anime.translations ?? []} />
      </section>
    </main>
  )
}
