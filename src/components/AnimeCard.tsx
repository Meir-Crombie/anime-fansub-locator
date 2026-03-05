import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export interface AnimeCardData {
  id: string
  title_he: string
  title_en: string
  cover_image_url: string | null
  genres: string[]
}

interface AnimeCardProps {
  anime: AnimeCardData
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const displayGenres = anime.genres?.slice(0, 3) ?? []
  const extraGenres = (anime.genres?.length ?? 0) - 3

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group block rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {anime.cover_image_url ? (
          <Image
            src={anime.cover_image_url}
            alt={anime.title_he}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            אין תמונה
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-bold text-sm leading-tight line-clamp-2">
          {anime.title_he}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 anime-title">
          {anime.title_en}
        </p>

        {/* Genre badges */}
        {displayGenres.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {displayGenres.map((genre) => (
              <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 py-0">
                {genre}
              </Badge>
            ))}
            {extraGenres > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{extraGenres}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
