'use client'

import { useState } from 'react'
import { approveApplication, rejectApplication } from '@/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { FansubApplication } from '@/lib/types'

interface ApplicationReviewListProps {
  applications: FansubApplication[]
}

const FIELD_LABELS: Record<string, string> = {
  name: 'שם הקבוצה',
  description: 'תיאור',
  founded_at: 'תאריך הקמה',
  website_url: 'אתר',
  telegram_url: 'טלגרם',
  discord_url: 'דיסקורד',
  logo_url: 'לוגו',
  manager_email: 'אימייל המנהל',
}

export default function ApplicationReviewList({ applications }: ApplicationReviewListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())

  async function handleApprove(id: string) {
    setProcessingId(id)
    const result = await approveApplication(id)
    if (!result.error) {
      setProcessedIds((prev) => new Set(prev).add(id))
    }
    setProcessingId(null)
  }

  async function handleReject(id: string) {
    setProcessingId(id)
    const result = await rejectApplication(id, rejectNote)
    if (!result.error) {
      setProcessedIds((prev) => new Set(prev).add(id))
    }
    setProcessingId(null)
    setRejectingId(null)
    setRejectNote('')
  }

  const pendingApps = applications.filter((a) => !processedIds.has(a.id))

  return (
    <div className="space-y-4">
      {pendingApps.map((app) => {
        const formData = (app.form_data ?? {}) as Record<string, string>

        return (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{formData.name ?? 'ללא שם'}</CardTitle>
                <Badge variant="outline">{formatDate(app.created_at)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Display form data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(formData).map(([key, value]) => {
                  if (!value) return null
                  return (
                    <div key={key}>
                      <span className="font-medium">{FIELD_LABELS[key] ?? key}: </span>
                      <span className="text-muted-foreground" dir="auto">{value}</span>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              {rejectingId === app.id ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="סיבת הדחייה..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(app.id)}
                      disabled={processingId === app.id}
                    >
                      {processingId === app.id && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                      אשר דחייה
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectingId(null)
                        setRejectNote('')
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(app.id)}
                    disabled={processingId === app.id}
                  >
                    {processingId === app.id ? (
                      <Loader2 className="h-4 w-4 me-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 me-1" />
                    )}
                    אישור
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectingId(app.id)}
                    disabled={processingId === app.id}
                  >
                    <X className="h-4 w-4 me-1" />
                    דחייה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
