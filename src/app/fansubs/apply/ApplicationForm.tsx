'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitFansubApplication } from '@/actions/applications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">בקשתך התקבלה!</h2>
          <p className="text-muted-foreground">
            בקשתך התקבלה ותיבדק על ידי הנהלת האתר. נעדכן אותך כשתאושר.
          </p>
          <Button onClick={() => router.push('/')}>חזרה לדף הבית</Button>
        </CardContent>
      </Card>
    )
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">טופס ההרשמה אינו מוגדר עדיין. נסה שוב מאוחר יותר.</p>
          <Button variant="outline" onClick={() => router.back()}>חזרה</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label htmlFor={field.field_key} className="text-sm font-medium">
                {field.field_label_he}
                {field.is_required && <span className="text-destructive ms-1">*</span>}
              </label>

              {field.field_type === 'textarea' ? (
                <textarea
                  id={field.field_key}
                  value={formData[field.field_key] ?? ''}
                  onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                  placeholder={field.placeholder_he ?? undefined}
                  required={field.is_required}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                />
              ) : field.field_type === 'select' ? (
                <select
                  id={field.field_key}
                  value={formData[field.field_key] ?? ''}
                  onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                  required={field.is_required}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">בחר...</option>
                  {(field.options as string[] | null)?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.field_key}
                  type={field.field_type === 'url' ? 'url' : field.field_type === 'email' ? 'email' : field.field_type === 'date' ? 'date' : 'text'}
                  dir={field.field_type === 'url' || field.field_type === 'email' ? 'ltr' : 'auto'}
                  value={formData[field.field_key] ?? ''}
                  onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                  placeholder={field.placeholder_he ?? undefined}
                  required={field.is_required}
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              שלח בקשה
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
