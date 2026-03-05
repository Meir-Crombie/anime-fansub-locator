'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/lib/constants'

interface AnimeResult {
  id: string
  title_he: string
  title_en: string
  cover_image_url: string | null
}

interface AnimeSearchInputProps {
  selectedAnimes: AnimeResult[]
  onChange: (animes: AnimeResult[]) => void
  multiple?: boolean
}

export default function AnimeSearchInput({
  selectedAnimes,
  onChange,
  multiple = true,
}: AnimeSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AnimeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < SEARCH_MIN_LENGTH) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        // Filter out already selected
        const selectedIds = new Set(selectedAnimes.map((a) => a.id))
        setResults(
          (json.data as AnimeResult[]).filter((a) => !selectedIds.has(a.id))
        )
        setIsOpen(true)
      }
    } catch {
      // Silently fail search
    } finally {
      setIsLoading(false)
    }
  }, [selectedAnimes])

  function handleChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.trim().length === 0) {
      setResults([])
      setIsOpen(false)
      return
    }
    timerRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, SEARCH_DEBOUNCE_MS)
  }

  function selectAnime(anime: AnimeResult) {
    if (multiple) {
      onChange([...selectedAnimes, anime])
    } else {
      onChange([anime])
    }
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  function removeAnime(id: string) {
    onChange(selectedAnimes.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          type="search"
          dir="auto"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="חפש אנימה..."
          className="ps-9"
        />

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
            {results.map((anime) => (
              <button
                key={anime.id}
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-start"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectAnime(anime)}
              >
                <div className="relative h-6 w-5 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {anime.cover_image_url ? (
                    <Image
                      src={anime.cover_image_url}
                      alt={anime.title_he}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[6px]">🎬</div>
                  )}
                </div>
                <span className="truncate">{anime.title_he}</span>
                <span className="text-xs text-muted-foreground truncate">{anime.title_en}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {selectedAnimes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAnimes.map((anime) => (
            <div
              key={anime.id}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm bg-secondary"
            >
              <div className="relative h-5 w-4 flex-shrink-0 overflow-hidden rounded bg-muted">
                {anime.cover_image_url ? (
                  <Image
                    src={anime.cover_image_url}
                    alt={anime.title_he}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <span className="max-w-[120px] truncate">{anime.title_he}</span>
              <button
                type="button"
                onClick={() => removeAnime(anime.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
