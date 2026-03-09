'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createUserSubmission } from '@/actions/submissions'
import {
  userSubmissionStep0Schema,
  userSubmissionStep1Schema,
  type UserSubmissionFormValues,
} from '@/lib/validations/submission'
import { GENRES } from '@/lib/constants'
import ImageUpload from '@/components/ImageUpload'

const TOTAL_STEPS = 4

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'בתרגום פעיל', color: '#22c55e', icon: '⚡' },
  { value: 'completed', label: 'הושלם', color: '#3b82f6', icon: '✓' },
  { value: 'unknown', label: 'לא ידוע', color: '#9ca3af', icon: '?' },
] as const

const PLATFORM_OPTIONS = [
  { value: 'website', label: 'אתר אינטרנט', icon: '🌐', color: '#06b6d4' },
  { value: 'telegram', label: 'טלגרם', icon: '✈️', color: '#3b82f6' },
  { value: 'discord', label: 'דיסקורד', icon: '🎮', color: '#8b5cf6' },
  { value: 'youtube', label: 'יוטיוב', icon: '▶', color: '#ef4444' },
  { value: 'other', label: 'אחר', icon: '🔗', color: '#6b7280' },
] as const

const QUALITY_OPTIONS = [
  { value: 'excellent', label: 'מצוינת', desc: 'תרגום מקצועי ומדויק' },
  { value: 'good', label: 'טובה', desc: 'תרגום סביר עם טעויות מינוריות' },
  { value: 'basic', label: 'בסיסית', desc: 'תרגום ברמה בסיסית' },
] as const

const STEP_LABELS = [
  'פרטי האנימה',
  'פרטי התרגום',
  'פרטים נוספים',
  'סיכום ואישור',
] as const

export default function UserSubmissionForm() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Partial<UserSubmissionFormValues>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function updateField<K extends keyof UserSubmissionFormValues>(
    key: K,
    value: UserSubmissionFormValues[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validateStep(): boolean {
    setErrors({})
    if (step === 0) {
      const result = userSubmissionStep0Schema.safeParse(formData)
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of result.error.issues) {
          const path = issue.path[0]
          if (path && !fieldErrors[String(path)]) {
            fieldErrors[String(path)] = issue.message
          }
        }
        setErrors(fieldErrors)
        return false
      }
    } else if (step === 1) {
      const result = userSubmissionStep1Schema.safeParse(formData)
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of result.error.issues) {
          const path = issue.path[0]
          if (path && !fieldErrors[String(path)]) {
            fieldErrors[String(path)] = issue.message
          }
        }
        setErrors(fieldErrors)
        return false
      }
    }
    return true
  }

  function handleNext() {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    if (!validateStep()) return

    setIsSubmitting(true)
    setErrors({})
    try {
      const result = await createUserSubmission(formData)
      if (result?.error) {
        setErrors({ _form: 'שגיאה באימות הנתונים. בדוק את כל השדות.' })
      } else {
        setIsSuccess(true)
      }
    } catch {
      setErrors({ _form: 'שגיאה בשליחת הדיווח. נסה שוב מאוחר יותר.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 bg-background"
      >
        <div className="text-center max-w-md w-full p-8 glass-card rounded-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold mb-2 font-syne text-foreground">
            הדיווח נשלח בהצלחה!
          </h2>
          <p className="text-sm mb-4 text-muted-foreground">
            הדיווח שלך ממתין לאישור מנהל. נעדכן אותך כשהוא יאושר.
          </p>
          <div className="inline-flex items-center gap-2 mx-auto rounded-full px-4 py-1.5 text-sm bg-amber-500/10 border border-amber-500/20 text-amber-400">
            ⭐ +50 XP עם אישור
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-10 bg-background"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl mb-1 font-syne font-extrabold text-foreground">
            דיווח על תרגום
          </h1>
          <p className="text-sm text-muted-foreground">
            מצאת תרגום לאנימה? ספר לנו! הצוות יבדוק ויוסיף אותו לאתר.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className={`text-xs font-medium font-heebo ${
                  i <= step ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-muted">
            <div
              className="h-full rounded-full transition-all duration-300 bg-primary"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Step 0 — Anime Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <SectionLabel label="שם האנימה" required />
                <input
                  type="text"
                  value={formData.anime_name ?? ''}
                  onChange={(e) => updateField('anime_name', e.target.value)}
                  placeholder="הזן את שם האנימה בעברית"
                  className={cn('usf-input', errors.anime_name && 'usf-input-error')}
                  style={{ direction: 'rtl' }}
                />
                {errors.anime_name && <FieldError message={errors.anime_name} />}
              </div>
              <div>
                <SectionLabel label="שם באנגלית" />
                <input
                  type="text"
                  value={formData.anime_name_en ?? ''}
                  onChange={(e) => updateField('anime_name_en', e.target.value)}
                  placeholder="English title (optional)"
                  className="usf-input"
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
              </div>
              <div>
                <SectionLabel label="תמונת כיסוי" />
                <ImageUpload
                  value={(formData as Record<string, unknown>).cover_image_url as string ?? ''}
                  onChange={(url) => updateField('cover_image_url' as keyof UserSubmissionFormValues, url as never)}
                />
              </div>
              <div>
                <SectionLabel label="ז'אנרים" />
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => {
                    const selected = ((formData as Record<string, unknown>).genres as string[] ?? []).includes(genre.value)
                    return (
                      <button
                        key={genre.value}
                        type="button"
                        onClick={() => {
                          const current = ((formData as Record<string, unknown>).genres as string[]) ?? []
                          const next = selected
                            ? current.filter((g) => g !== genre.value)
                            : [...current, genre.value]
                          updateField('genres' as keyof UserSubmissionFormValues, next as never)
                        }}
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
            </div>
          )}

          {/* Step 1 — Translation Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <SectionLabel label="שם המתרגם / הקבוצה" required />
                <input
                  type="text"
                  value={formData.translator_name ?? ''}
                  onChange={(e) => updateField('translator_name', e.target.value)}
                  placeholder="שם המתרגם או שם הקבוצה"
                  className={cn('usf-input', errors.translator_name && 'usf-input-error')}
                />
                {errors.translator_name && <FieldError message={errors.translator_name} />}
              </div>

              <div>
                <SectionLabel label="קישור לתרגום" required />
                <input
                  type="url"
                  value={formData.translation_url ?? ''}
                  onChange={(e) => updateField('translation_url', e.target.value)}
                  placeholder="https://..."
                  className={cn('usf-input', errors.translation_url && 'usf-input-error')}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
                {errors.translation_url && <FieldError message={errors.translation_url} />}
              </div>
              <div>
                <SectionLabel label="פלטפורמה" required />
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {PLATFORM_OPTIONS.map((opt) => {
                    const selected = formData.platform_type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField('platform_type', opt.value)}
                        className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl cursor-pointer transition-all duration-200"
                        style={{
                          border: `1.5px solid ${selected ? opt.color : 'hsl(var(--border))'}`,
                          background: selected
                            ? `color-mix(in srgb, ${opt.color} 12%, transparent)`
                            : 'transparent',
                        }}
                      >
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
                {errors.platform_type && <FieldError message={errors.platform_type} />}
              </div>

              {/* Status */}
              <div>
                <SectionLabel label="סטטוס תרגום" required />
                <div className="grid grid-cols-3 gap-3">
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
                            style={{
                              top: '6px',
                              left: '8px',
                              fontSize: '0.65rem',
                              color: opt.color,
                            }}
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

              {/* Credits */}
              <div>
                <SectionLabel label="קרדיטים" />
                <input
                  type="text"
                  value={(formData as Record<string, unknown>).credits as string ?? ''}
                  onChange={(e) => updateField('credits' as keyof UserSubmissionFormValues, e.target.value as never)}
                  placeholder="תרגום: פלוני, עריכה: אלמוני"
                  className="usf-input"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Optional details */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <SectionLabel label="תיאור" />
                <div className="relative">
                  <textarea
                    value={formData.description ?? ''}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        updateField('description', e.target.value)
                      }
                    }}
                    placeholder="הוסף פרטים נוספים על התרגום..."
                    rows={4}
                    className="usf-input resize-none"
                  />
                  <span className="absolute bottom-2 left-3 text-xs text-muted-foreground/50">
                    {(formData.description ?? '').length}/300
                  </span>
                </div>
              </div>

              <div>
                <SectionLabel label="איכות התרגום" />
                <div className="grid grid-cols-1 gap-2">
                  {QUALITY_OPTIONS.map((opt) => {
                    const selected = formData.language_quality === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateField(
                            'language_quality',
                            selected ? undefined : opt.value
                          )
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 text-right border-[1.5px] ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-transparent'
                        }`}
                      >
                        <div>
                          <div className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
                            {opt.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold mb-3 text-foreground font-heebo">
                סיכום הדיווח
              </h3>
              <ReviewRow label="שם האנימה" value={formData.anime_name} />
              {formData.anime_name_en && (
                <ReviewRow label="שם באנגלית" value={formData.anime_name_en} />
              )}
              <ReviewRow label="שם המתרגם" value={formData.translator_name} />
              <ReviewRow label="קישור" value={formData.translation_url} ltr />
              <ReviewRow
                label="פלטפורמה"
                value={
                  PLATFORM_OPTIONS.find((p) => p.value === formData.platform_type)?.label
                }
              />
              <ReviewRow
                label="סטטוס"
                value={STATUS_OPTIONS.find((s) => s.value === formData.status)?.label}
              />
              {formData.description && (
                <ReviewRow label="תיאור" value={formData.description} />
              )}
              {formData.language_quality && (
                <ReviewRow
                  label="איכות תרגום"
                  value={
                    QUALITY_OPTIONS.find((q) => q.value === formData.language_quality)?.label
                  }
                />
              )}
              {Boolean((formData as Record<string, unknown>).cover_image_url) && (
                <ReviewRow label="תמונת כיסוי" value={(formData as Record<string, unknown>).cover_image_url as string} ltr />
              )}
              {((formData as Record<string, unknown>).genres as string[] ?? []).length > 0 && (
                <ReviewRow label="ז'אנרים" value={((formData as Record<string, unknown>).genres as string[]).join(', ')} />
              )}
              {Boolean((formData as Record<string, unknown>).credits) && (
                <ReviewRow label="קרדיטים" value={(formData as Record<string, unknown>).credits as string} />
              )}
            </div>
          )}

          {/* Navigation */}
          {errors._form && <FieldError message={errors._form} />}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-[1.5px] border-border text-muted-foreground bg-transparent hover:border-primary/50 cursor-pointer font-heebo"
              >
                חזרה
              </button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 px-8 font-bold font-heebo text-base shadow-lg shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                המשך
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 px-8 font-bold font-heebo text-base shadow-lg shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'שולח...' : 'שלח דיווח'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .usf-input {
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
        .usf-input:focus {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.06);
        }
        .usf-input::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .usf-input-error {
          border-color: hsl(var(--destructive));
        }
      `}</style>
    </div>
  )
}

function SectionLabel({
  label,
  required,
}: {
  label: string
  required?: boolean
}) {
  return (
    <div className="flex items-center gap-1 mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground font-heebo">
      {label}
      {required && <span className="text-primary">*</span>}
      {!required && (
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

function ReviewRow({
  label,
  value,
  ltr,
}: {
  label: string
  value: string | undefined
  ltr?: boolean
}) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
      <span className="text-xs font-medium shrink-0 text-muted-foreground min-w-[5rem]">
        {label}
      </span>
      <span
        className="text-sm text-foreground break-all"
        style={{
          direction: ltr ? 'ltr' : undefined,
          textAlign: ltr ? 'left' : undefined,
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}
