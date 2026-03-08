'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { submitManagerTranslation } from '@/actions/translations'
import {
  groupManagerFormSchema,
  type GroupManagerFormValues,
} from '@/lib/validations/submission'

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'בתרגום פעיל', color: '#22c55e', icon: '⚡' },
  { value: 'completed', label: 'הושלם', color: '#3b82f6', icon: '✓' },
  { value: 'dropped', label: 'נזנח', color: '#ef4444', icon: '✕' },
  { value: 'paused', label: 'מושהה', color: '#f59e0b', icon: '⏸' },
] as const

const PLATFORM_OPTIONS = [
  { value: 'website', label: 'אתר אינטרנט', icon: '🌐' },
  { value: 'telegram', label: 'טלגרם', icon: '✈️' },
  { value: 'discord', label: 'דיסקורד', icon: '🎮' },
  { value: 'youtube', label: 'יוטיוב', icon: '▶' },
] as const

const QUALITY_OPTIONS = [
  { value: 'bluray', label: 'Blu-ray' },
  { value: 'web', label: 'WEB' },
  { value: 'tv', label: 'TV' },
  { value: 'dvd', label: 'DVD' },
] as const

interface GroupManagerFormProps {
  fansubId: string
  fansubName: string
}

export default function GroupManagerForm({ fansubName }: GroupManagerFormProps) {
  const [formData, setFormData] = useState<Partial<GroupManagerFormValues>>({
    platforms: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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

  function togglePlatform(platform: string) {
    const current = formData.platforms ?? []
    const next = current.includes(platform as 'website' | 'telegram' | 'discord' | 'youtube')
      ? current.filter((p) => p !== platform)
      : [...current, platform as 'website' | 'telegram' | 'discord' | 'youtube']
    updateField('platforms', next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

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
      const result = await submitManagerTranslation(validated.data)
      if (result?.error) {
        setErrors({ _form: 'שגיאה בשמירת הנתונים. בדוק את כל השדות.' })
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
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: '#0a0a0f',
          backgroundImage:
            'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(124,111,247,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(34,197,94,0.08) 0%, transparent 60%)',
        }}
      >
        <div
          className="text-center max-w-md w-full p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)' }}
          >
            <span className="text-3xl">✓</span>
          </div>
          <h2
            className="text-xl font-bold mb-2 font-space-mono"
            style={{ color: '#e2e0f0' }}
          >
            התרגום פורסם בהצלחה!
          </h2>
          <p className="text-sm" style={{ color: '#9d99b8' }}>
            התרגום של {fansubName} זמין כעת באתר ויופיע בדף האנימה ובפרופיל הקבוצה.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-10"
      style={{
        background: '#0a0a0f',
        backgroundImage:
          'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(124,111,247,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(34,197,94,0.08) 0%, transparent 60%)',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p
            className="text-xs tracking-widest mb-2 font-space-mono"
            style={{
              color: '#7c6ff7',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            {fansubName}
          </p>
          <h1
            className="text-2xl font-bold font-heebo"
            style={{ color: '#e2e0f0', fontWeight: 800 }}
          >
            פרסום תרגום חדש
          </h1>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Anime Name */}
          <div>
            <SectionLabel label="שם האנימה" required />
            <input
              type="text"
              value={formData.anime_name ?? ''}
              onChange={(e) => updateField('anime_name', e.target.value)}
              placeholder="הזן את שם האנימה בעברית"
              className={cn('form-input-base', errors.anime_name && 'form-input-error')}
              style={{ direction: 'rtl' }}
            />
            {errors.anime_name && <FieldError message={errors.anime_name} />}
          </div>

          {/* Anime Name EN */}
          <div>
            <SectionLabel label="שם באנגלית / רומאג'י" />
            <input
              type="text"
              value={formData.anime_name_en ?? ''}
              onChange={(e) => updateField('anime_name_en', e.target.value)}
              placeholder="English / Romaji title"
              className="form-input-base"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          {/* Status */}
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
                      ['--accent' as string]: opt.color,
                      border: `1.5px solid ${selected ? opt.color : 'rgba(255,255,255,0.07)'}`,
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
                      style={{ color: selected ? opt.color : '#9d99b8' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.status && <FieldError message={errors.status} />}
          </div>

          {/* Platforms */}
          <div>
            <SectionLabel label="פלטפורמות" required />
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((opt) => {
                const selected = formData.platforms?.includes(
                  opt.value as 'website' | 'telegram' | 'discord' | 'youtube'
                )
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePlatform(opt.value)}
                    className="transition-all duration-200"
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '999px',
                      border: `1.5px solid ${selected ? '#7c6ff7' : 'rgba(255,255,255,0.1)'}`,
                      background: selected ? 'rgba(124,111,247,0.15)' : 'transparent',
                      color: selected ? '#c4bfff' : '#9d99b8',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: "'Heebo', sans-serif",
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                )
              })}
            </div>
            {errors.platforms && <FieldError message={errors.platforms} />}
          </div>

          {/* Direct Link */}
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

          {/* Episode Range */}
          <div>
            <SectionLabel label="טווח פרקים" optional />
            <input
              type="text"
              value={formData.episode_range ?? ''}
              onChange={(e) => updateField('episode_range', e.target.value)}
              placeholder='לדוגמה: 1-12'
              className="form-input-base"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          {/* Release Date */}
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

          {/* Quality */}
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

          {/* Notes */}
          <div>
            <SectionLabel label="הערות" optional />
            <textarea
              value={formData.notes ?? ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder='הערות נוספות...'
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
            className="w-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #7c6ff7 0%, #5a4fd4 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.8rem 2rem',
              fontWeight: 700,
              fontFamily: "'Heebo', sans-serif",
              fontSize: '1rem',
              boxShadow: '0 4px 20px rgba(124,111,247,0.3)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,111,247,0.45)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,111,247,0.3)'
            }}
          >
            {isSubmitting ? 'שומר...' : 'פרסם תרגום'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .form-input-base {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #e2e0f0;
          font-family: 'Heebo', sans-serif;
          font-size: 0.97rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input-base:focus {
          border-color: #7c6ff7;
          background: rgba(124, 111, 247, 0.06);
        }
        .form-input-base::placeholder {
          color: #4a4760;
        }
        .form-input-error {
          border-color: #ef4444;
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
    <div
      className="flex items-center gap-1 mb-2"
      style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#9d99b8',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: "'Heebo', sans-serif",
      }}
    >
      {label}
      {required && <span style={{ color: '#7c6ff7' }}>*</span>}
      {optional && (
        <span
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#6b6880',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '0.68rem',
          }}
        >
          אופציונלי
        </span>
      )}
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-1 mt-1"
      style={{ fontSize: '0.78rem', color: '#f87171' }}
    >
      <span>⚠</span>
      <span>{message}</span>
    </div>
  )
}
