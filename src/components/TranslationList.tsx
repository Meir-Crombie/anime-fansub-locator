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

// עדכנו את הטקסטים שיהיו הרבה יותר ברורים וקריאה לפעולה
const PLATFORM_LABELS: Record<string, string> = {
  website: 'לצפייה באתר',
  telegram: 'צפייה בטלגרם',
  discord: 'צפייה בדיסקורד',
  youtube: 'צפייה ביוטיוב',
  other: 'קישור לצפייה',
}

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'בתרגום',
  completed: 'הושלם',
  unknown: 'לא ידוע',
}

const getPlatformIcon = (platform: string) => {
  if (platform === 'website') return <Globe className="h-4 w-4" />
  if (platform === 'telegram') return <Send className="h-4 w-4" />
  return null
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
        const generalStatus = fansubTranslations[0].status 

        return (
          <div key={fansubId} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border bg-card p-4 gap-4 transition-all hover:bg-accent/5">
            
            {/* צד ימין: שם הפאנסאב וסטטוס */}
            <div className="flex items-center gap-4 shrink-0">
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

            {/* אמצע: הערות/פרקים - משתמש ב-flex-1 כדי לדחוף את הכפתורים שמאלה */}
            <div className="text-sm text-muted-foreground flex-1 sm:px-4 text-start">
               {fansubTranslations.find(t => t.notes)?.notes}
            </div>

            {/* צד שמאל: כפתורי פלטפורמות קומפקטיים */}
            <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
              {fansubTranslations.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  size="icon"
                  asChild
                  className="shrink-0 p-2 h-8 w-8 md:w-auto md:px-3 md:h-8 text-primary border-primary hover:bg-primary/10 transition-colors relative group"
                  title={PLATFORM_LABELS[t.platform] ?? t.platform}
                >
                  <a
                    href={t.direct_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 md:gap-2"
                  >
                    {getPlatformIcon(t.platform)}
                    <span className="hidden md:inline text-xs font-normal">{PLATFORM_LABELS[t.platform] ?? t.platform}</span>
                    <ExternalLink className="h-3 w-3 md:h-4 md:w-4 opacity-70" />
                  </a>
                </Button>
              ))}
            </div>
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
                
                {/* צד ימין */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-semibold text-lg">{sub.translator_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {STATUS_LABELS[sub.status] ?? sub.status}
                  </Badge>
                </div>
                
                {/* אמצע */}
                <div className="text-sm text-muted-foreground flex-1 sm:px-4 text-start">
                  {sub.description}
                </div>

                {/* צד שמאל */}
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  <Button 
                    variant="default" 
                    size="sm" 
                    asChild 
                    className="shrink-0 font-medium bg-[#0ea5e9] hover:bg-[#0284c7] text-white transition-colors"
                  >
                    <a
                      href={sub.translation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      {getPlatformIcon(sub.platform_type)}
                      <span>{PLATFORM_LABELS[sub.platform_type] ?? sub.platform_type}</span>
                      <ExternalLink className="h-4 w-4" /> {/* חץ ההעברה המבוקש */}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}