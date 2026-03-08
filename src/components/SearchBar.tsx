'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Loader2, Users, ArrowLeft } from 'lucide-react'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'

const SMART_SEARCH_MIN = 1

type SearchMode = 'anime' | 'fansub'

interface AnimeResult {
  id: string
  title_he: string
  title_en: string
  cover_image_url: string | null
  genres: string[]
  similarity: number
}

interface FansubResult {
  id: string
  name: string
  logo_url: string | null
  description: string | null
  similarity: number
}

export default function SearchBar() {
  const router = useRouter()
  const [mode, setMode] = useState<SearchMode>('anime')
  const [query, setQuery] = useState('')
  const [animeResults, setAnimeResults] = useState<AnimeResult[]>([])
  const [fansubResults, setFansubResults] = useState<FansubResult[]>([])
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

  const [crossModeCount, setCrossModeCount] = useState<number | null>(null)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < SMART_SEARCH_MIN) {
      setAnimeResults([])
      setFansubResults([])
      setIsOpen(false)
      setCrossModeCount(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setCrossModeCount(null)

    try {
      const endpoint = mode === 'anime' ? '/api/search' : '/api/search-fansubs'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error ?? 'שגיאה בחיפוש')
        setAnimeResults([])
        setFansubResults([])
      } else if (mode === 'anime') {
        setAnimeResults(json.data ?? [])
        setFansubResults([])
        setIsOpen(true)

        // Cross-mode: check fansubs too if no anime results
        if ((!json.data || json.data.length === 0) && searchQuery.length >= 2) {
          const crossRes = await fetch('/api/search-fansubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery }),
          })
          const crossJson = await crossRes.json()
          if (crossRes.ok && crossJson.data?.length > 0) {
            setCrossModeCount(crossJson.data.length)
          }
        }
      } else {
        setFansubResults(json.data ?? [])
        setAnimeResults([])
        setIsOpen(true)

        // Cross-mode: check anime too if no fansub results
        if ((!json.data || json.data.length === 0) && searchQuery.length >= 2) {
          const crossRes = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery }),
          })
          const crossJson = await crossRes.json()
          if (crossRes.ok && crossJson.data?.length > 0) {
            setCrossModeCount(crossJson.data.length)
          }
        }
      }
    } catch {
      setError('שגיאת רשת. נסה שוב.')
      setAnimeResults([])
      setFansubResults([])
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  function handleChange(value: string) {
    setQuery(value)
    setSelectedIndex(-1)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (value.trim().length === 0) {
      setAnimeResults([])
      setFansubResults([])
      setIsOpen(false)
      setError(null)
      setCrossModeCount(null)
      return
    }

    timerRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, SEARCH_DEBOUNCE_MS)
  }

  const results = mode === 'anime' ? animeResults : fansubResults

  function selectResult(id: string) {
    setIsOpen(false)
    setQuery('')
    router.push(mode === 'anime' ? `/anime/${id}` : `/fansub/${id}`)
  }

  function handleModeChange(newMode: SearchMode) {
    setMode(newMode)
    setAnimeResults([])
    setFansubResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    setCrossModeCount(null)
    if (query.trim().length >= SMART_SEARCH_MIN) {
      // Re-search with the new mode after state update
      setTimeout(() => performSearch(query.trim()), 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim().length >= SMART_SEARCH_MIN) {
        if (mode === 'anime') {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        } else {
          router.push('/fansubs')
        }
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
        } else if (mode === 'anime') {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        } else {
          router.push('/fansubs')
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Mode tabs */}
      <div className="flex gap-1 mb-2 justify-center">
        <button
          onClick={() => handleModeChange('anime')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'anime'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="h-3.5 w-3.5 inline me-1" aria-hidden />
          אנימה
        </button>
        <button
          onClick={() => handleModeChange('fansub')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            mode === 'fansub'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5 inline me-1" aria-hidden />
          קבוצות
        </button>
      </div>

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
          placeholder={mode === 'anime' ? 'חפש אנימה בעברית, אנגלית או ביפנית...' : 'חפש קבוצת פאנסאב...'}
          aria-label={mode === 'anime' ? 'חיפוש אנימה' : 'חיפוש קבוצת פאנסאב'}
          className="w-full rounded-2xl border border-border bg-card/80 pe-12 ps-5 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 backdrop-blur-sm"
        />
      </div>

      {/* Validation message */}
      {query.length > 0 && query.length < SMART_SEARCH_MIN && (
        <p className="mt-1 text-xs text-muted-foreground text-center">
          הכנס לפחות {SMART_SEARCH_MIN} תווים
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
                  {mode === 'anime' ? (
                    <>
                      <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {(result as AnimeResult).cover_image_url ? (
                          <Image
                            src={(result as AnimeResult).cover_image_url!}
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
                        <p className="font-medium text-sm truncate">{(result as AnimeResult).title_he}</p>
                        <p className="text-xs text-muted-foreground truncate anime-title">
                          {(result as AnimeResult).title_en}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                        {(result as FansubResult).logo_url ? (
                          <Image
                            src={(result as FansubResult).logo_url!}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{(result as FansubResult).name}</p>
                        {(result as FansubResult).description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {(result as FansubResult).description}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && query.length >= SMART_SEARCH_MIN && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground space-y-2">
                <p>לא נמצאו תוצאות עבור &ldquo;{query}&rdquo;</p>
                {query.length >= 2 && (
                  <p className="text-xs">חיפוש זה נשמר למאגר הרצונות</p>
                )}
                {crossModeCount !== null && crossModeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleModeChange(mode === 'anime' ? 'fansub' : 'anime')}
                    className="text-xs text-primary hover:underline"
                  >
                    {mode === 'anime'
                      ? `נמצאו ${crossModeCount} תוצאות בקבוצות פאנסאב — לחץ לעבור`
                      : `נמצאו ${crossModeCount} תוצאות באנימה — לחץ לעבור`}
                  </button>
                )}
                <div>
                  <Link
                    href={mode === 'anime' ? `/search?q=${encodeURIComponent(query.trim())}` : '/fansubs'}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {mode === 'anime' ? 'חפש בעמוד החיפוש המלא' : 'צפה בכל הקבוצות'}
                    <ArrowLeft className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </div>
            )
          )}

          {/* View-all footer */}
          {results.length > 0 && (
            <div className="border-t border-border">
              <Link
                href={mode === 'anime' ? `/search?q=${encodeURIComponent(query.trim())}` : '/fansubs'}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-primary hover:bg-accent/50 transition-colors"
              >
                {mode === 'anime' ? 'הצג את כל התוצאות' : 'צפה בכל הקבוצות'}
                <ArrowLeft className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
