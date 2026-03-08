'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createUserSubmission } from '@/actions/submissions'
import {
  userSubmissionStep0Schema,
  userSubmissionStep1Schema,
  type UserSubmissionFormValues,
} from '@/lib/validations/submission'

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
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: '#080c14',
          backgroundImage:
            'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(6,182,212,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(245,158,11,0.08) 0%, transparent 60%)',
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
            style={{ background: 'rgba(6,182,212,0.12)' }}
          >
            <span className="text-3xl">⏳</span>
          </div>
          <h2
            className="text-xl font-bold mb-2 font-syne"
            style={{ color: '#e2e0f0' }}
          >
            הדיווח נשלח בהצלחה!
          </h2>
          <p className="text-sm mb-4" style={{ color: '#9d99b8' }}>
            הדיווח שלך ממתין לאישור מנהל. נעדכן אותך כשהוא יאושר.
          </p>
          <div
            className="inline-flex items-center gap-2 mx-auto"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '999px',
              color: '#fbbf24',
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
            }}
          >
            ⭐ +50 XP עם אישור
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-10"
      style={{
        background: '#080c14',
        backgroundImage:
          'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(6,182,212,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(245,158,11,0.08) 0%, transparent 60%)',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl mb-1 font-syne"
            style={{
              color: '#e2e0f0',
              fontWeight: 800,
            }}
          >
            דיווח על תרגום
          </h1>
          <p className="text-sm" style={{ color: '#9d99b8' }}>
            מצאת תרגום לאנימה? ספר לנו! הצוות יבדוק ויוסיף אותו לאתר.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className="text-xs font-medium"
                style={{
                  color: i <= step ? '#06b6d4' : '#4a4760',
                  fontFamily: "'Heebo', sans-serif",
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                background: 'linear-gradient(90deg, #06b6d4, #0891b2)',
              }}
            />
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
          }}
        >
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

              {/* Platform — icon grid */}
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
                          border: `1.5px solid ${selected ? opt.color : 'rgba(255,255,255,0.07)'}`,
                          background: selected
                            ? `color-mix(in srgb, ${opt.color} 12%, transparent)`
                            : 'transparent',
                        }}
                      >
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
                  <span
                    className="absolute bottom-2 left-3 text-xs"
                    style={{ color: '#4a4760' }}
                  >
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
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 text-right"
                        style={{
                          border: `1.5px solid ${selected ? '#06b6d4' : 'rgba(255,255,255,0.07)'}`,
                          background: selected
                            ? 'rgba(6,182,212,0.08)'
                            : 'transparent',
                        }}
                      >
                        <div>
                          <div
                            className="text-sm font-medium"
                            style={{ color: selected ? '#06b6d4' : '#e2e0f0' }}
                          >
                            {opt.label}
                          </div>
                          <div className="text-xs" style={{ color: '#6b6880' }}>
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
              <h3
                className="text-base font-bold mb-3"
                style={{ color: '#e2e0f0', fontFamily: "'Heebo', sans-serif" }}
              >
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
            </div>
          )}

          {/* Navigation */}
          {errors._form && <FieldError message={errors._form} />}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  color: '#9d99b8',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: "'Heebo', sans-serif",
                }}
              >
                חזרה
              </button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.8rem 2rem',
                  fontWeight: 700,
                  fontFamily: "'Heebo', sans-serif",
                  fontSize: '1rem',
                  boxShadow: '0 4px 20px rgba(6,182,212,0.3)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(6,182,212,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(6,182,212,0.3)'
                }}
              >
                המשך
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.8rem 2rem',
                  fontWeight: 700,
                  fontFamily: "'Heebo', sans-serif",
                  fontSize: '1rem',
                  boxShadow: '0 4px 20px rgba(6,182,212,0.3)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(6,182,212,0.45)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(6,182,212,0.3)'
                }}
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
        .usf-input:focus {
          border-color: #06b6d4;
          background: rgba(6, 182, 212, 0.06);
        }
        .usf-input::placeholder {
          color: #4a4760;
        }
        .usf-input-error {
          border-color: #ef4444;
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
      {required && <span style={{ color: '#06b6d4' }}>*</span>}
      {!required && (
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
    <div
      className="flex items-start gap-2 p-3 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <span className="text-xs font-medium shrink-0" style={{ color: '#6b6880', minWidth: '5rem' }}>
        {label}
      </span>
      <span
        className="text-sm"
        style={{
          color: '#e2e0f0',
          direction: ltr ? 'ltr' : undefined,
          textAlign: ltr ? 'left' : undefined,
          wordBreak: 'break-all',
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}
