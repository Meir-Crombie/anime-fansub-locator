'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { GENRES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface GenreFilterProps {
  selectedGenres: string[]
  onChange: (genres: string[]) => void
}

export default function GenreFilter({ selectedGenres, onChange }: GenreFilterProps) {
  const [showAll, setShowAll] = useState(false)
  const displayedGenres = showAll ? GENRES : GENRES.slice(0, 10)

  function toggleGenre(genre: string) {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter((g) => g !== genre))
    } else {
      onChange([...selectedGenres, genre])
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {displayedGenres.map((genre) => {
        const isSelected = selectedGenres.includes(genre.value)
        return (
          <Badge
            key={genre.value}
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-colors select-none',
              isSelected && 'bg-primary text-primary-foreground'
            )}
            onClick={() => toggleGenre(genre.value)}
          >
            {genre.label}
          </Badge>
        )
      })}
      {GENRES.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? 'הצג פחות' : `+${GENRES.length - 10} נוספים`}
        </button>
      )}
    </div>
  )
}
