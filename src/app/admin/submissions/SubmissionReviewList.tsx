'use client'

import { useState } from 'react'
import { approveSubmission, deleteSubmission } from '@/actions/submissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, Trash2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { UserSubmission } from '@/lib/types'

const PLATFORM_LABELS: Record<string, string> = {
  website: 'אתר',
  telegram: 'טלגרם',
  discord: 'דיסקורד',
  youtube: 'יוטיוב',
  other: 'אחר',
}

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'בתרגום',
  completed: 'הושלם',
  unknown: 'לא ידוע',
}

const QUALITY_LABELS: Record<string, string> = {
  excellent: 'מצוין',
  good: 'טוב',
  basic: 'בסיסי',
}

interface SubmissionReviewListProps {
  submissions: UserSubmission[]
}

export default function SubmissionReviewList({ submissions }: SubmissionReviewListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const [showVerified, setShowVerified] = useState(false)

  async function handleApprove(id: string) {
    setProcessingId(id)
    const result = await approveSubmission(id)
    if (!result.error) {
      setProcessedIds((prev) => new Set(prev).add(id))
    }
    setProcessingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק את הדיווח הזה?')) return
    setProcessingId(id)
    const result = await deleteSubmission(id)
    if (!result.error) {
      setProcessedIds((prev) => new Set(prev).add(id))
    }
    setProcessingId(null)
  }

  const visible = submissions.filter((s) => !processedIds.has(s.id))
  const pending = visible.filter((s) => !s.is_verified)
  const verified = visible.filter((s) => s.is_verified)

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">ממתינים לאישור ({pending.length})</h2>
          {pending.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              processingId={processingId}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}

      {verified.length > 0 && (
        <section className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVerified(!showVerified)}
          >
            {showVerified ? 'הסתר' : 'הצג'} מאושרים ({verified.length})
          </Button>
          {showVerified &&
            verified.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                processingId={processingId}
                onDelete={handleDelete}
                verified
              />
            ))}
        </section>
      )}

      {pending.length === 0 && verified.length === 0 && (
        <p className="text-muted-foreground text-center py-8">אין דיווחים להצגה</p>
      )}
    </div>
  )
}

function SubmissionCard({
  submission,
  processingId,
  onApprove,
  onDelete,
  verified,
}: {
  submission: UserSubmission
  processingId: string | null
  onApprove?: (id: string) => void
  onDelete: (id: string) => void
  verified?: boolean
}) {
  const isProcessing = processingId === submission.id

  return (
    <Card className={verified ? 'opacity-75' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">
            {submission.anime_name}
            {submission.anime_name_en && (
              <span className="text-muted-foreground text-sm font-normal mr-2">
                ({submission.anime_name_en})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {verified && <Badge variant="secondary">מאושר</Badge>}
            <Badge variant="outline">{formatDate(submission.created_at)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">מתרגם / קבוצה: </span>
            <span className="text-muted-foreground">{submission.translator_name}</span>
          </div>
          <div>
            <span className="font-medium">פלטפורמה: </span>
            <span className="text-muted-foreground">
              {PLATFORM_LABELS[submission.platform_type] ?? submission.platform_type}
            </span>
          </div>
          <div>
            <span className="font-medium">סטטוס: </span>
            <span className="text-muted-foreground">
              {STATUS_LABELS[submission.status] ?? submission.status}
            </span>
          </div>
          {submission.language_quality && (
            <div>
              <span className="font-medium">איכות תרגום: </span>
              <span className="text-muted-foreground">
                {QUALITY_LABELS[submission.language_quality] ?? submission.language_quality}
              </span>
            </div>
          )}
          <div className="sm:col-span-2">
            <span className="font-medium">קישור: </span>
            <a
              href={submission.translation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {submission.translation_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {submission.description && (
            <div className="sm:col-span-2">
              <span className="font-medium">תיאור: </span>
              <span className="text-muted-foreground">{submission.description}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!verified && onApprove && (
            <Button
              size="sm"
              onClick={() => onApprove(submission.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 me-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 me-1" />
              )}
              אישור
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(submission.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 me-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 me-1" />
            )}
            מחיקה
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
