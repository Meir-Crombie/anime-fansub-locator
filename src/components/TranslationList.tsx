import Link from 'next/link'
import { ExternalLink, Users, Globe, Send } from 'lucide-react'
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

// Helper to choose the right icon based on platform
const getPlatformIcon = (platform: string) => {
  if (platform === 'website') return <Globe className="h-4 w-4 me-1.5" />
  if (platform === 'telegram') return <Send className="h-4 w-4 me-1.5" />
  return <ExternalLink className="h-4 w-4 me-1.5" />
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
    <div className="space-y-4">
      {Object.entries(grouped).map(([fansubId, fansubTranslations]) => {
        const fansub = fansubTranslations[0].fansub_groups
        // Assuming all translations from the same fansub have the same overall status for this anime
        const generalStatus = fansubTranslations[0].status 

        return (
          <div key={fansubId} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border bg-card p-4 gap-4 transition-all hover:bg-accent/5">
            
            {/* Right side: Fansub Info & Status */}
            <div className="flex items-center gap-4">
              <Link
                href={`/fansub/${fansubId}`}
                className="font-semibold text-lg hover:text-primary transition-colors"
              >
                {fansub.name}
              </Link>
              <Badge variant="outline" className="text-xs">
                 {STATUS_LABELS[generalStatus] ?? generalStatus}
              </Badge>
            </div>

            {/* Left side: Buttons for different platforms */}
            <div className="flex flex-wrap items-center gap-2">
              {fansubTranslations.map((t) => (
                <Button key={t.id} variant="secondary" size="sm" asChild className="shrink-0">
                  <a
                    href={t.direct_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getPlatformIcon(t.platform)}
                    {PLATFORM_LABELS[t.platform] ?? t.platform}
                  </a>
                </Button>
              ))}
            </div>

            {/* Show notes if any of the translations have them (Optional) */}
            {fansubTranslations.some(t => t.notes) && (
              <div className="w-full text-xs text-muted-foreground mt-2 sm:mt-0 sm:w-auto">
                 {fansubTranslations.find(t => t.notes)?.notes}
              </div>
            )}
          </div>
        )
      })}

      {/* Community submissions — not tied to a fansub group */}
      {hasSubmissions && (
        <>
          {hasTranslations && <Separator className="my-6" />}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="h-4 w-4" aria-hidden />
              <span className="font-medium">דיווחי קהילה</span>
            </div>
            {communitySubmissions.map((sub) => (
              <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border bg-card p-4 gap-4 transition-all hover:bg-accent/5">
                
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg">{sub.translator_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{STATUS_LABELS[sub.status] ?? sub.status}</Badge>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <a
                      href={sub.translation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getPlatformIcon(sub.platform_type)}
                      {PLATFORM_LABELS[sub.platform_type] ?? sub.platform_type}
                    </a>
                  </Button>
                  {sub.description && (
                    <span className="text-xs text-muted-foreground w-full sm:w-auto">
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