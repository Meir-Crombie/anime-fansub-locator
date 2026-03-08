'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2 } from 'lucide-react'
import { resolveModerationRequest } from '@/actions/moderation'
import { formatDate } from '@/lib/utils'

interface ModerationRequest {
  id: string
  reported_item_id: string
  item_type: string
  reason: string
  status: string
  created_at: string
}

interface ModerationListProps {
  requests: ModerationRequest[]
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  review: 'ביקורת',
  comment: 'תגובה',
  translation: 'תרגום',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין',
  approved_deleted: 'אושר ונמחק',
  rejected: 'נדחה',
}

export default function ModerationList({ requests: initialRequests }: ModerationListProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setLoadingId(id)
    const result = await resolveModerationRequest(id, action)
    if (!result.error) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: action === 'approve' ? 'approved_deleted' : 'rejected' }
            : r
        )
      )
      router.refresh()
    }
    setLoadingId(null)
  }

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-8">אין בקשות מתינה.</p>
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="py-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">
                  {ITEM_TYPE_LABELS[req.item_type] ?? req.item_type}
                </Badge>
                <Badge variant={req.status === 'pending' ? 'default' : 'secondary'}>
                  {STATUS_LABELS[req.status] ?? req.status}
                </Badge>
              </div>
              <p className="text-sm">{req.reason}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(req.created_at)}</p>
            </div>
            {req.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(req.id, 'approve')}
                  disabled={loadingId === req.id}
                >
                  {loadingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 me-1" />}
                  אשר ומחק
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(req.id, 'reject')}
                  disabled={loadingId === req.id}
                >
                  <X className="h-4 w-4 me-1" />
                  דחה
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
