import AnimeCard from '@/components/AnimeCard'
import type { AnimeCardData } from '@/components/AnimeCard'
import EmptyState from '@/components/EmptyState'

interface AnimeGridProps {
  animes: AnimeCardData[]
}

export default function AnimeGrid({ animes }: AnimeGridProps) {
  if (animes.length === 0) {
    return <EmptyState message="טרם נוספו אנימות למאגר" />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  )
}
