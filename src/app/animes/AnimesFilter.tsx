'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import GenreFilter from '@/components/GenreFilter'

const EPISODE_LENGTHS = [
  { value: '', label: 'הכל' },
  { value: 'short', label: 'קצרה (1-12)' },
  { value: 'medium', label: 'בינונית (13-25)' },
  { value: 'long', label: 'ארוכה (26+)' },
] as const

interface AnimesFilterProps {
  initialQuery: string
  initialGenre: string
  initialLength: string
}

export default function AnimesFilter({ initialQuery, initialGenre, initialLength }: AnimesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/animes?${params.toString()}`)
    },
    [router, searchParams]
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams('q', query.trim())
  }

  function handleGenreChange(genres: string[]) {
    updateParams('genre', genres.join(','))
  }

  const selectedGenres = initialGenre ? initialGenre.split(',').filter(Boolean) : []

  return (
    <div className="space-y-4">
      {/* Inline search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפש אנימה..."
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          חפש
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-4">
        {/* Genre filter */}
        <div className="flex-1 min-w-0">
          <GenreFilter selectedGenres={selectedGenres} onChange={handleGenreChange} />
        </div>

        {/* Episode length filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">אורך:</span>
          <div className="flex gap-1.5">
            {EPISODE_LENGTHS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams('length', opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  initialLength === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
