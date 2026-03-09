'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Loader2, Users, ArrowLeft } from 'lucide-react'

const MIN_CHARS = 2
const DEBOUNCE_MS = 300

type SearchMode = 'anime' | 'fansub'

interface AnimeResult {
  id: string
  title_he: string
  title_en: string
  cover_image_url: string | null
  genres: string[]
  similarity_score: number
}

interface FansubResult {
  id: string
  name: string
  logo_url: string | null
  description: string | null
  translation_count: number
  similarity_score: number
}

type SearchResult = AnimeResult | FansubResult

export default function SearchBar() {
  const router = useRouter()
  const [mode, setMode] = useState<SearchMode>('anime')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [crossModeHint, setCrossModeHint] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController | null>(null)

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const doSearch = useCallback(async (q: string, searchMode: SearchMode) => {
    // Abort previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setCrossModeHint(null)

    try {
      const endpoint = searchMode === 'anime' ? '/api/search' : '/api/search-fansubs'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      })
      const json = await res.json()

      if (controller.signal.aborted) return

      if (!res.ok || json.error) {
        setResults([])
        setIsOpen(true)
        return
      }

      const data: SearchResult[] = json.data ?? []
      setResults(data)
      setIsOpen(true)

      // Cross-mode check when no results
      if (data.length === 0 && q.length >= MIN_CHARS) {
        const otherEndpoint = searchMode === 'anime' ? '/api/search-fansubs' : '/api/search'
        try {
          const crossRes = await fetch(otherEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q }),
            signal: controller.signal,
          })
          const crossJson = await crossRes.json()
          if (!controller.signal.aborted && crossRes.ok && crossJson.data?.length > 0) {
            const n = crossJson.data.length
            setCrossModeHint(
              searchMode === 'anime'
                ? `נמצאו ${n} תוצאות בקבוצות פאנסאב — לחץ לעבור`
                : `נמצאו ${n} תוצאות באנימה — לחץ לעבור`
            )
          }
        } catch {
          // Cross-mode check is best-effort
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setResults([])
      setIsOpen(true)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    setSelectedIndex(-1)
    if (timerRef.current) clearTimeout(timerRef.current)

    const trimmed = value.trim()
    if (trimmed.length < MIN_CHARS) {
      setResults([])
      setIsOpen(false)
      setCrossModeHint(null)
      abortRef.current?.abort()
      setIsLoading(false)
      return
    }

    timerRef.current = setTimeout(() => doSearch(trimmed, mode), DEBOUNCE_MS)
  }

  function switchMode(newMode: SearchMode) {
    if (newMode === mode) return
    setMode(newMode)
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    setCrossModeHint(null)
    const trimmed = query.trim()
    if (trimmed.length >= MIN_CHARS) {
      doSearch(trimmed, newMode)
    }
  }

  function navigate(id: string) {
    setIsOpen(false)
    setQuery('')
    router.push(mode === 'anime' ? `/anime/${id}` : `/fansub/${id}`)
  }

  function goToFullPage() {
    setIsOpen(false)
    if (mode === 'anime') {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/fansubs')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim().length >= MIN_CHARS) {
        goToFullPage()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) navigate(results[selectedIndex].id)
        else goToFullPage()
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Mode toggle */}
      <div className="flex gap-1 mb-2 justify-center">
        <button
          type="button"
          onClick={() => switchMode('anime')}
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
          type="button"
          onClick={() => switchMode('fansub')}
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

      {/* Input */}
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
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={mode === 'anime' ? '...חפש אנימה בעברית, אנגלית או ביפנית' : 'חפש קבוצת פאנסאב...'}
          aria-label={mode === 'anime' ? 'חיפוש אנימה' : 'חיפוש קבוצת פאנסאב'}
          className="w-full rounded-2xl border border-border bg-card/80 pe-12 ps-5 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 backdrop-blur-sm"
        />
      </div>

      {/* Min chars hint */}
      {query.length > 0 && query.trim().length < MIN_CHARS && (
        <p className="mt-1 text-xs text-muted-foreground text-center">
          הכנס לפחות {MIN_CHARS} תווים
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-xl border bg-popover shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <ul role="listbox">
                {results.map((result, idx) => (
                  <li
                    key={result.id}
                    role="option"
                    aria-selected={idx === selectedIndex}
                    onClick={() => navigate(result.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      idx === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
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
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {(result as AnimeResult).title_he}
                          </p>
                          <p className="text-xs text-muted-foreground truncate anime-title">
                            {(result as AnimeResult).title_en}
                          </p>
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
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {(result as FansubResult).name}
                          </p>
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
              {/* View all footer */}
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
            </>
          ) : (
            !isLoading && query.trim().length >= MIN_CHARS && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground space-y-2">
                <p>לא נמצאו תוצאות עבור &ldquo;{query}&rdquo;</p>
                <p className="text-xs">חיפוש זה נשמר למאגר הרצונות</p>
                {crossModeHint && (
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'anime' ? 'fansub' : 'anime')}
                    className="text-xs text-primary hover:underline"
                  >
                    {crossModeHint}
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
        </div>
      )}
    </div>
  )
}
