'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronDown, ChevronUp, Dices, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type EpisodePreset = 'all' | 'short' | 'medium' | 'long' | 'custom'
type SeasonPreset = 'all' | 'one' | 'two_three' | 'four_plus'

const EPISODE_PRESETS: { value: EpisodePreset; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'short', label: 'קצר (1-13)' },
  { value: 'medium', label: 'בינוני (14-50)' },
  { value: 'long', label: 'ארוך (51+)' },
  { value: 'custom', label: 'טווח מותאם' },
]

const SEASON_PRESETS: { value: SeasonPreset; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'one', label: 'עונה אחת' },
  { value: 'two_three', label: '2-3 עונות' },
  { value: 'four_plus', label: '4+' },
]

function getEpisodeRange(preset: EpisodePreset, customMin?: number, customMax?: number) {
  switch (preset) {
    case 'short':  return { min_ep: 1, max_ep: 13 }
    case 'medium': return { min_ep: 14, max_ep: 50 }
    case 'long':   return { min_ep: 51, max_ep: undefined }
    case 'custom': return { min_ep: customMin, max_ep: customMax }
    default:       return { min_ep: undefined, max_ep: undefined }
  }
}

function getSeasonRange(preset: SeasonPreset) {
  switch (preset) {
    case 'one':        return { min_season: 1, max_season: 1 }
    case 'two_three':  return { min_season: 2, max_season: 3 }
    case 'four_plus':  return { min_season: 4, max_season: undefined }
    default:           return { min_season: undefined, max_season: undefined }
  }
}

export default function SmartRandomizer() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [episodePreset, setEpisodePreset] = useState<EpisodePreset>('all')
  const [customMinEp, setCustomMinEp] = useState<number | undefined>(undefined)
  const [customMaxEp, setCustomMaxEp] = useState<number | undefined>(undefined)
  const [seasonPreset, setSeasonPreset] = useState<SeasonPreset>('all')

  useEffect(() => {
    fetch('/api/genres')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setAvailableGenres(json.data)
        }
      })
      .catch(() => {})
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedGenres.length > 0) count++
    if (episodePreset !== 'all') count++
    if (seasonPreset !== 'all') count++
    return count
  }, [selectedGenres, episodePreset, seasonPreset])

  const hasActiveFilters = activeFilterCount > 0

  const toggleGenre = useCallback((genre: string) => {
    setError(null)
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }, [])

  function clearFilters() {
    setSelectedGenres([])
    setEpisodePreset('all')
    setCustomMinEp(undefined)
    setCustomMaxEp(undefined)
    setSeasonPreset('all')
    setError(null)
  }

  async function handleRandomize() {
    setIsLoading(true)
    setError(null)

    const { min_ep, max_ep } = getEpisodeRange(episodePreset, customMinEp, customMaxEp)
    const { min_season, max_season } = getSeasonRange(seasonPreset)

    const body: Record<string, unknown> = {}
    if (selectedGenres.length > 0) body.genres = selectedGenres
    if (min_ep !== undefined) body.min_ep = min_ep
    if (max_ep !== undefined) body.max_ep = max_ep
    if (min_season !== undefined) body.min_season = min_season
    if (max_season !== undefined) body.max_season = max_season

    try {
      const res = await fetch('/api/randomize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (json.error === 'no_results') {
        setError('לא נמצאה אנימה שמתאימה לפילטרים שבחרת. נסה פילטרים אחרים.')
        return
      }
      if (json.error || !json.data) {
        setError('משהו השתבש. נסה שוב.')
        return
      }

      router.push(`/anime/${json.data.id}`)
    } catch {
      setError('שגיאת רשת. נסה שוב.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Main row: randomize button + filter toggle */}
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={handleRandomize}
          disabled={isLoading}
          size="lg"
          className="gap-2 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Dices className="h-5 w-5" aria-hidden />
          )}
          <span>
            {isLoading
              ? 'מחפש...'
              : hasActiveFilters
                ? '🎲 אנימה אקראית לפי הפילטרים'
                : '🎲 אנימה אקראית'}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className="gap-1.5 rounded-full relative"
        >
          <span>פילטרים</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden />
          )}
          {hasActiveFilters && (
            <Badge className="absolute -top-2 -start-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-purple-600 text-white border-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Filter panel */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="rounded-xl border bg-card p-5 space-y-5">
          {/* Genre Section */}
          {availableGenres.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">ז&apos;אנרים</h3>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre)
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        'rounded-full px-3 py-1 text-sm border transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border bg-background text-foreground hover:bg-accent'
                      )}
                    >
                      {genre}
                      {isSelected && ' ✓'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Episode Count */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">כמות פרקים</h3>
            <div className="flex flex-wrap gap-2">
              {EPISODE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setEpisodePreset(preset.value)
                    setError(null)
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-sm border transition-colors',
                    episodePreset === preset.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-background text-foreground hover:bg-accent'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {episodePreset === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  placeholder="מינ׳"
                  value={customMinEp ?? ''}
                  onChange={(e) => {
                    setCustomMinEp(e.target.value ? Number(e.target.value) : undefined)
                    setError(null)
                  }}
                  className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-center"
                  dir="ltr"
                />
                <span className="text-sm text-muted-foreground">עד</span>
                <input
                  type="number"
                  min={1}
                  placeholder="מקס׳"
                  value={customMaxEp ?? ''}
                  onChange={(e) => {
                    setCustomMaxEp(e.target.value ? Number(e.target.value) : undefined)
                    setError(null)
                  }}
                  className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-center"
                  dir="ltr"
                />
              </div>
            )}
          </div>

          {/* Season Count */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">עונות</h3>
            <div className="flex flex-wrap gap-2">
              {SEASON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setSeasonPreset(preset.value)
                    setError(null)
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-sm border transition-colors',
                    seasonPreset === preset.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-background text-foreground hover:bg-accent'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear + Randomize row */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="h-4 w-4" aria-hidden />
                נקה פילטרים
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
