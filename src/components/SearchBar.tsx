'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Loader2 } from 'lucide-react'
import { SEARCH_MIN_LENGTH, SEARCH_DEBOUNCE_MS } from '@/lib/constants'

interface SearchResult {
  id: string
  title_he: string
  title_en: string
  cover_image_url: string | null
  genres: string[]
  similarity: number
}

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < SEARCH_MIN_LENGTH) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error ?? 'שגיאה בחיפוש')
        setResults([])
      } else {
        setResults(json.data ?? [])
        setIsOpen(true)
      }
    } catch {
      setError('שגיאת רשת. נסה שוב.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    setSelectedIndex(-1)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (value.trim().length === 0) {
      setResults([])
      setIsOpen(false)
      setError(null)
      return
    }

    timerRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, SEARCH_DEBOUNCE_MS)
  }

  function selectResult(id: string) {
    setIsOpen(false)
    setQuery('')
    router.push(`/anime/${id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim().length >= SEARCH_MIN_LENGTH) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          selectResult(results[selectedIndex].id)
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" aria-hidden />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <input
          type="search"
          dir="auto"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="חפש אנימה בעברית, אנגלית או ביפנית..."
          aria-label="חיפוש אנימה"
          className="w-full rounded-2xl border border-border bg-card/80 pe-12 ps-5 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 backdrop-blur-sm"
        />
      </div>

      {/* Validation message */}
      {query.length > 0 && query.length < SEARCH_MIN_LENGTH && (
        <p className="mt-1 text-xs text-muted-foreground text-center">
          הכנס לפחות {SEARCH_MIN_LENGTH} תווים
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-destructive text-center">{error}</p>
      )}

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-xl border bg-popover shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <ul role="listbox">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => selectResult(result.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded bg-muted">
                    {result.cover_image_url ? (
                      <Image
                        src={result.cover_image_url}
                        alt=""
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{result.title_he}</p>
                    <p className="text-xs text-muted-foreground truncate anime-title">
                      {result.title_en}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && query.length >= SEARCH_MIN_LENGTH && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                לא נמצאו תוצאות עבור &ldquo;{query}&rdquo;
                <br />
                <span className="text-xs">חיפוש זה נשמר למאגר הרצונות</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
