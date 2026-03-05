import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { TranslationBadge } from '@/components/TranslationBadge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import EmptyState from '@/components/EmptyState'
import type { Translation, FansubGroup } from '@/lib/types'

interface TranslationWithFansub extends Translation {
  fansub_groups: FansubGroup
}

interface TranslationListProps {
  translations: TranslationWithFansub[]
}

export default function TranslationList({ translations }: TranslationListProps) {
  if (translations.length === 0) {
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
    </div>
  )
}
