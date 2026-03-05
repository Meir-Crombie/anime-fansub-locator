import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import FansubCard from '@/components/FansubCard'
import AnimeGrid from '@/components/AnimeGrid'
import type { Metadata } from 'next'
import type { FansubGroup } from '@/lib/types'
import type { AnimeCardData } from '@/components/AnimeCard'

interface FansubPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: FansubPageProps): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: fansub } = await supabase
    .from('fansub_groups')
    .select('name, description')
    .eq('id', params.id)
    .single()

  if (!fansub) return { title: 'קבוצת פאנסאב לא נמצאה' }

  return {
    title: `${fansub.name} | Fansub Hub`,
    description: fansub.description ?? `דף קבוצת הפאנסאב ${fansub.name}`,
  }
}

export default async function FansubPage({ params }: FansubPageProps) {
  const supabase = createServerClient()

  const { data: fansub, error } = await supabase
    .from('fansub_groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !fansub) notFound()

  // Fetch translated animes by this fansub
  const { data: translations } = await supabase
    .from('translations')
    .select('anime_id, animes(id, title_he, title_en, cover_image_url, genres)')
    .eq('fansub_id', params.id)

  // Deduplicate animes (one fansub can have multiple translations per anime)
  const animeMap = new Map<string, AnimeCardData>()
  translations?.forEach((t) => {
    const anime = t.animes as unknown as AnimeCardData
    if (anime && !animeMap.has(anime.id)) {
      animeMap.set(anime.id, anime)
    }
  })
  const animes = Array.from(animeMap.values())

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-10">
      <FansubCard fansub={fansub as FansubGroup} />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">
          אנימות שתורגמו ({animes.length})
        </h2>
        <AnimeGrid animes={animes} />
      </section>
    </main>
  )
}
