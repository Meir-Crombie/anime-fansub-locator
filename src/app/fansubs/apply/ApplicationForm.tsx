'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitFansubApplication } from '@/actions/applications'
import { Loader2, CheckCircle2 } from 'lucide-react'
import type { FormField } from '@/lib/types'

interface ApplicationFormProps {
  fields: FormField[]
}

export default function ApplicationForm({ fields }: ApplicationFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation
    for (const field of fields) {
      if (field.is_required && (!formData[field.field_key] || formData[field.field_key].trim() === '')) {
        setError(`השדה "${field.field_label_he}" הוא שדה חובה`)
        return
      }
    }

    // URL validation for URL fields
    for (const field of fields) {
      if (field.field_type === 'url' && formData[field.field_key]) {
        try {
          new URL(formData[field.field_key])
        } catch {
          setError(`הכתובת בשדה "${field.field_label_he}" אינה תקינה`)
          return
        }
      }
    }

    // Email validation
    for (const field of fields) {
      if (field.field_type === 'email' && formData[field.field_key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData[field.field_key])) {
          setError(`האימייל בשדה "${field.field_label_he}" אינו תקין`)
          return
        }
      }
    }

    setIsSubmitting(true)

    const result = await submitFansubApplication(formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      setIsSuccess(true)
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="glass-card rounded-2xl py-16 text-center space-y-6 px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground font-heebo">הבקשה נשלחה בהצלחה!</h2>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            תודה שהגשת את קבוצתך לרישום באתר.
            <br />
            הבקשה תיבדק על ידי הנהלת האתר ונחזור אליך בהקדם.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-2.5 px-6 font-bold font-heebo shadow-lg shadow-primary/30 transition-all duration-200 cursor-pointer"
          >
            חזרה לדף הבית
          </button>
          <button
            onClick={() => {
              setIsSuccess(false)
              setFormData({})
            }}
            className="border border-border text-muted-foreground hover:text-foreground rounded-xl py-2.5 px-6 font-heebo transition-all duration-200 cursor-pointer"
          >
            הגשת בקשה נוספת
          </button>
        </div>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="glass-card rounded-2xl py-12 text-center space-y-4 px-6">
        <p className="text-muted-foreground">טופס ההרשמה אינו מוגדר עדיין. נסה שוב מאוחר יותר.</p>
        <button
          onClick={() => router.back()}
          className="border border-border text-muted-foreground hover:text-foreground rounded-xl py-2 px-6 font-heebo transition-all duration-200 cursor-pointer"
        >
          חזרה
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center gap-1 mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground font-heebo">
              {field.field_label_he}
              {field.is_required && <span className="text-primary">*</span>}
            </div>

            {field.field_type === 'textarea' ? (
              <textarea
                id={field.field_key}
                value={formData[field.field_key] ?? ''}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                placeholder={field.placeholder_he ?? undefined}
                required={field.is_required}
                className="app-form-input min-h-[80px] resize-y"
              />
            ) : field.field_type === 'select' ? (
              <select
                id={field.field_key}
                value={formData[field.field_key] ?? ''}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                required={field.is_required}
                className="app-form-input"
              >
                <option value="">בחר...</option>
                {(field.options as string[] | null)?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.field_key}
                type={field.field_type === 'url' ? 'url' : field.field_type === 'email' ? 'email' : field.field_type === 'date' ? 'date' : 'text'}
                dir={field.field_type === 'url' || field.field_type === 'email' ? 'ltr' : 'auto'}
                value={formData[field.field_key] ?? ''}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                placeholder={field.placeholder_he ?? undefined}
                required={field.is_required}
                className="app-form-input"
              />
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 px-8 font-bold font-heebo text-base shadow-lg shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            שלח בקשה
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-border text-muted-foreground hover:text-foreground rounded-xl py-3 px-6 font-heebo transition-all duration-200 cursor-pointer"
          >
            ביטול
          </button>
        </div>
      </form>

      <style jsx>{`
        .app-form-input {
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
        .app-form-input:focus {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.06);
        }
        .app-form-input::placeholder {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}
