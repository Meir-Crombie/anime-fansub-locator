'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { submitManagerTranslation } from '@/actions/translations'
import {
  groupManagerFormSchema,
  type GroupManagerFormValues,
} from '@/lib/validations/submission'
import { GENRES } from '@/lib/constants'
import ImageUpload from '@/components/ImageUpload'

interface AnimeResult {
  id: string
  title_he: string
  title_en: string
}

const STATUS_OPTIONS = [
  { value: 'ongoing' as const, label: 'בתרגום פעיל', color: '#22c55e', icon: '⚡' },
  { value: 'completed' as const, label: 'הושלם', color: '#3b82f6', icon: '✓' },
  { value: 'dropped' as const, label: 'נזנח', color: '#ef4444', icon: '✕' },
  { value: 'paused' as const, label: 'מושהה', color: '#f59e0b', icon: '⏸' },
]

const PLATFORM_OPTIONS = [
  { value: 'website' as const, label: 'אתר אינטרנט', icon: '🌐' },
  { value: 'telegram' as const, label: 'טלגרם', icon: '✈️' },
  { value: 'youtube' as const, label: 'יוטיוב', icon: '▶' },
]

const QUALITY_OPTIONS = [
  { value: 'bluray', label: 'Blu-ray' },
  { value: 'web', label: 'WEB' },
  { value: 'tv', label: 'TV' },
  { value: 'dvd', label: 'DVD' },
]

type PlatformValue = GroupManagerFormValues['platforms'][number]

interface GroupManagerFormProps {
  fansubId: string
  fansubName: string
}

export default function GroupManagerForm({ fansubId, fansubName }: GroupManagerFormProps) {
  const [formData, setFormData] = useState<Partial<GroupManagerFormValues>>({
    platforms: [],
    genres: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Anime autocomplete state
  const [animeQuery, setAnimeQuery] = useState('')
  const [animeResults, setAnimeResults] = useState<AnimeResult[]>([])
  const [selectedAnime, setSelectedAnime] = useState<AnimeResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAnimes = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setAnimeResults([])
      setShowDropdown(false)
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch('/api/animes-autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const json = await res.json()
      setAnimeResults(json.data ?? [])
      setShowDropdown(true)
    } catch {
      setAnimeResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  function handleAnimeQueryChange(value: string) {
    setAnimeQuery(value)
    // Clear selection if user edits after selecting
    if (selectedAnime) {
      setSelectedAnime(null)
      setFormData((prev) => {
        const next = { ...prev }
        delete next.anime_id
        delete next.anime_name
        return next
      })
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next.anime_name
      delete next.anime_id
      return next
    })
    // Debounced search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAnimes(value), 300)
  }

  function selectAnime(anime: AnimeResult) {
    setSelectedAnime(anime)
    setAnimeQuery(anime.title_he)
    setShowDropdown(false)
    setFormData((prev) => ({
      ...prev,
      anime_id: anime.id,
      anime_name: anime.title_he,
      anime_name_en: anime.title_en || undefined,
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.anime_name
      delete next.anime_id
      return next
    })
  }

  function updateField<K extends keyof GroupManagerFormValues>(
    key: K,
    value: GroupManagerFormValues[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function togglePlatform(platform: PlatformValue) {
    const current = formData.platforms ?? []
    const next = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform]
    updateField('platforms', next)
  }

  function toggleGenre(genre: string) {
    const current = formData.genres ?? []
    const next = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre]
    updateField('genres', next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Block submission if no anime selected from autocomplete
    if (!selectedAnime || !formData.anime_id) {
      setErrors({ anime_name: 'יש לבחור אנימה מהרשימה' })
      return
    }

    const validated = groupManagerFormSchema.safeParse(formData)
    if (!validated.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validated.error.issues) {
        const path = issue.path[0]
        if (path && !fieldErrors[String(path)]) {
          fieldErrors[String(path)] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitManagerTranslation({ ...validated.data, fansub_id: fansubId })
      if (result?.error) {
        const err = result.error
        if (typeof err === 'object' && 'formErrors' in err) {
          const formErrors = (err as { formErrors: string[] }).formErrors
          setErrors({ _form: formErrors[0] ?? 'שגיאה בשמירת הנתונים.' })
        } else {
          setErrors({ _form: 'שגיאה בשמירת הנתונים. בדוק את כל השדות.' })
        }
      } else {
        setIsSuccess(true)
      }
    } catch {
      setErrors({ _form: 'שגיאה בשמירת התרגום. נסה שוב מאוחר יותר.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md w-full p-8 glass-card rounded-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold mb-2 font-space-mono text-foreground">
            התרגום פורסם בהצלחה!
          </h2>
          <p className="text-sm text-muted-foreground">
            התרגום של {fansubName} זמין כעת באתר ויופיע בדף האנימה ובפרופיל הקבוצה.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10 bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-widest mb-2 font-space-mono font-bold uppercase text-primary">
            {fansubName}
          </p>
          <h1 className="text-2xl font-extrabold font-heebo text-foreground">
            פרסום תרגום חדש
          </h1>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="space-y-6 glass-card rounded-2xl p-8">
          {/* Anime Name — autocomplete from DB */}
          <div ref={dropdownRef} className="relative">
            <SectionLabel label="שם האנימה" required />
            <div className="relative">
              <input
                type="text"
                value={animeQuery}
                onChange={(e) => handleAnimeQueryChange(e.target.value)}
                onFocus={() => { if (animeResults.length > 0 && !selectedAnime) setShowDropdown(true) }}
                placeholder="הקלד לחיפוש אנימה..."
                className={cn('form-input-base', (errors.anime_name || errors.anime_id) && 'form-input-error')}
                style={{ direction: 'rtl' }}
                autoComplete="off"
              />
              {isSearching && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  מחפש...
                </span>
              )}
              {selectedAnime && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
              )}
            </div>
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-popover shadow-xl max-h-60 overflow-y-auto">
                {animeResults.length > 0 ? (
                  animeResults.map((anime) => (
                    <button
                      key={anime.id}
                      type="button"
                      onClick={() => selectAnime(anime)}
                      className="w-full text-right px-4 py-2.5 hover:bg-accent transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
                    >
                      <span className="font-medium text-foreground">{anime.title_he}</span>
                      {anime.title_en && (
                        <span className="text-muted-foreground text-sm mr-2">({anime.title_en})</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    האנימה לא נמצאה. יש לפנות לאדמין להוספה.
                  </div>
                )}
              </div>
            )}
            {(errors.anime_name || errors.anime_id) && (
              <FieldError message={errors.anime_name || errors.anime_id} />
            )}
          </div>

          {/* English Name - shown after selection */}
          {selectedAnime && (
            <div>
              <SectionLabel label="שם באנגלית" optional />
              <input
                type="text"
                value={formData.anime_name_en ?? ''}
                onChange={(e) => updateField('anime_name_en', e.target.value)}
                placeholder="English Name"
                className="form-input-base"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          )}

          {/* Cover Image — upload */}
          <div>
            <SectionLabel label="תמונת כיסוי" optional />
            <ImageUpload
              value={formData.cover_image_url ?? ''}
              onChange={(url) => updateField('cover_image_url', url)}
            />
          </div>

          {/* Genres — optional */}
          <div>
            <SectionLabel label="ז'אנרים" optional />
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const selected = (formData.genres ?? []).includes(genre.value)
                return (
                  <button
                    key={genre.value}
                    type="button"
                    onClick={() => toggleGenre(genre.value)}
                    className="transition-all duration-200 cursor-pointer font-heebo"
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      border: `1.5px solid ${selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      background: selected ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                      color: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                    }}
                  >
                    {genre.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Credits — optional */}
          <div>
            <SectionLabel label="קרדיטים" optional />
            <input
              type="text"
              value={formData.credits ?? ''}
              onChange={(e) => updateField('credits', e.target.value)}
              placeholder="תרגום: פלוני, עריכה: אלמוני"
              className="form-input-base"
            />
          </div>

          {/* Status — required */}
          <div>
            <SectionLabel label="סטטוס תרגום" required />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATUS_OPTIONS.map((opt) => {
                const selected = formData.status === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('status', opt.value)}
                    className="relative flex flex-col items-center gap-1 cursor-pointer transition-all duration-200"
                    style={{
                      border: `1.5px solid ${selected ? opt.color : 'hsl(var(--border))'}`,
                      borderRadius: '12px',
                      padding: '0.85rem 0.5rem',
                      background: selected
                        ? `color-mix(in srgb, ${opt.color} 12%, transparent)`
                        : 'transparent',
                    }}
                  >
                    {selected && (
                      <span
                        className="absolute"
                        style={{ top: '6px', left: '8px', fontSize: '0.65rem', color: opt.color }}
                      >
                        ✓
                      </span>
                    )}
                    <span className="text-lg">{opt.icon}</span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: selected ? opt.color : 'hsl(var(--muted-foreground))' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.status && <FieldError message={errors.status} />}
          </div>

          {/* Platforms — required (at least 1) */}
          <div>
            <SectionLabel label="פלטפורמות" required />
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((opt) => {
                const selected = (formData.platforms ?? []).includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePlatform(opt.value)}
                    className="transition-all duration-200 cursor-pointer font-heebo"
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '999px',
                      border: `1.5px solid ${selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      background: selected ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                      color: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                )
              })}
            </div>
            {errors.platforms && <FieldError message={errors.platforms} />}
          </div>

          {/* Direct Link — required */}
          <div>
            <SectionLabel label="קישור ישיר" required />
            <input
              type="url"
              value={formData.direct_link ?? ''}
              onChange={(e) => updateField('direct_link', e.target.value)}
              placeholder="https://..."
              className={cn('form-input-base', errors.direct_link && 'form-input-error')}
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
            {errors.direct_link && <FieldError message={errors.direct_link} />}
          </div>

          {/* Episode Range — optional */}
          <div>
            <SectionLabel label="טווח פרקים" optional />
            <input
              type="text"
              value={formData.episode_range ?? ''}
              onChange={(e) => updateField('episode_range', e.target.value)}
              placeholder="לדוגמה: 1-12"
              className="form-input-base"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          {/* Release Date — optional */}
          <div>
            <SectionLabel label="תאריך פרסום" optional />
            <input
              type="date"
              value={formData.release_date ?? ''}
              onChange={(e) => updateField('release_date', e.target.value)}
              className="form-input-base"
              style={{ direction: 'ltr', textAlign: 'left', colorScheme: 'dark' }}
            />
          </div>

          {/* Quality — optional */}
          <div>
            <SectionLabel label="איכות" optional />
            <select
              value={formData.quality ?? ''}
              onChange={(e) => updateField('quality', e.target.value)}
              className="form-input-base"
            >
              <option value="">בחר איכות...</option>
              {QUALITY_OPTIONS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes — optional */}
          <div>
            <SectionLabel label="הערות" optional />
            <textarea
              value={formData.notes ?? ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="הערות נוספות..."
              rows={3}
              className="form-input-base resize-none"
            />
          </div>

          {/* Form-level error */}
          {errors._form && <FieldError message={errors._form} />}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 px-8 font-bold font-heebo text-base shadow-lg shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'שומר...' : 'פרסם תרגום'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .form-input-base {
          width: 100%;
          background: hsl(var(--input));
          border: 1.5px solid hsl(var(--border));
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: hsl(var(--foreground));
          font-family: 'Heebo', sans-serif;
          font-size: 0.97rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input-base:focus {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.06);
        }
        .form-input-base::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .form-input-error {
          border-color: hsl(var(--destructive));
        }
      `}</style>
    </div>
  )
}

function SectionLabel({
  label,
  required,
  optional,
}: {
  label: string
  required?: boolean
  optional?: boolean
}) {
  return (
    <div className="flex items-center gap-1 mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground font-heebo">
      {label}
      {required && <span className="text-primary">*</span>}
      {optional && (
        <span className="bg-muted text-muted-foreground/70 rounded-full px-2 py-0.5 text-[0.68rem]">
          אופציונלי
        </span>
      )}
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  )
}
