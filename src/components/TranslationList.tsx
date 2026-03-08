import Link from 'next/link'
import { ExternalLink, Users } from 'lucide-react'
import { TranslationBadge } from '@/components/TranslationBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import EmptyState from '@/components/EmptyState'
import type { Translation, FansubGroup, UserSubmission } from '@/lib/types'

interface TranslationWithFansub extends Translation {
  fansub_groups: FansubGroup
}

interface TranslationListProps {
  translations: TranslationWithFansub[]
  communitySubmissions?: UserSubmission[]
}

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

export default function TranslationList({ translations, communitySubmissions = [] }: TranslationListProps) {
  const hasTranslations = translations.length > 0
  const hasSubmissions = communitySubmissions.length > 0

  if (!hasTranslations && !hasSubmissions) {
    return (
      <EmptyState message="אין תרגומים זמינים לאנימה זו עדיין." />
    )
  }

  // Group by fansub
  const grouped = translations.reduce<Record<string, TranslationWithFansub[]>>(
    (acc, translation) => {
      const fansubId = translation.fansub_id
      if (!acc[fansubId]) {
        acc[fansubId] = []
      }
      acc[fansubId].push(translation)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([fansubId, fansubTranslations]) => {
        const fansub = fansubTranslations[0].fansub_groups
        return (
          <div key={fansubId} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href={`/fansub/${fansubId}`}
                className="font-semibold text-lg hover:text-primary transition-colors"
              >
                {fansub.name}
              </Link>
            </div>
            <Separator />
            <div className="space-y-3">
              {fansubTranslations.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-3"
                >
                  <TranslationBadge status={t.status} platform={t.platform} />
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={t.direct_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 me-1.5" aria-hidden />
                      צפייה
                    </a>
                  </Button>
                  {t.notes && (
                    <span className="text-xs text-muted-foreground">
                      {t.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Community submissions — not tied to a fansub group */}
      {hasSubmissions && (
        <>
          {hasTranslations && <Separator className="my-4" />}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden />
              <span className="font-medium">דיווחי קהילה</span>
            </div>
            {communitySubmissions.map((sub) => (
              <div key={sub.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-lg">{sub.translator_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{STATUS_LABELS[sub.status] ?? sub.status}</Badge>
                    <Badge variant="secondary">{PLATFORM_LABELS[sub.platform_type] ?? sub.platform_type}</Badge>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={sub.translation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 me-1.5" aria-hidden />
                      צפייה
                    </a>
                  </Button>
                  {sub.description && (
                    <span className="text-xs text-muted-foreground">
                      {sub.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
