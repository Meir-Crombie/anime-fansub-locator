'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertTranslation } from '@/actions/translations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { TRANSLATION_STATUSES, PLATFORMS } from '@/lib/constants'

export default function DashboardEditPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await upsertTranslation(formData)
      if (result?.error) {
        setError('שגיאה באימות הנתונים. בדוק את כל השדות.')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('שגיאה בשמירת התרגום.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>הוספה / עריכת תרגום</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="anime_id" className="text-sm font-medium">
                מזהה אנימה (UUID)
              </label>
              <Input
                id="anime_id"
                name="anime_id"
                dir="ltr"
                required
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fansub_id" className="text-sm font-medium">
                מזהה קבוצת פאנסאב (UUID)
              </label>
              <Input
                id="fansub_id"
                name="fansub_id"
                dir="ltr"
                required
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                סטטוס
              </label>
              <select
                id="status"
                name="status"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TRANSLATION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="platform" className="text-sm font-medium">
                פלטפורמה
              </label>
              <select
                id="platform"
                name="platform"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="direct_link" className="text-sm font-medium">
                קישור ישיר
              </label>
              <Input
                id="direct_link"
                name="direct_link"
                type="url"
                dir="ltr"
                required
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                הערות (אופציונלי)
              </label>
              <Input
                id="notes"
                name="notes"
                placeholder='למשל: "רק חלק 1", "Blu-ray"'
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden />}
                שמור תרגום
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                ביטול
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
