import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Send, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FansubGroup } from '@/lib/types'

interface FansubCardProps {
  fansub: FansubGroup & { translations?: { count: number }[] }
}

export default function FansubCard({ fansub }: FansubCardProps) {
  const translationCount = fansub.translations?.[0]?.count ?? null

  const yearsActive = fansub.established_year
    ? new Date().getFullYear() - fansub.established_year
    : null

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <Link href={`/fansub/${fansub.id}`} className="block">
        <CardHeader className="flex flex-row items-center gap-4 pb-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {fansub.logo_url ? (
              <Image
                src={fansub.logo_url}
                alt={fansub.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                {fansub.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{fansub.name}</CardTitle>
              {fansub.activity_status === 'inactive' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border flex-shrink-0">
                  לא פעיל
                </span>
              )}
              {fansub.activity_status === 'on_break' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                  בהפסקה
                </span>
              )}
            </div>
            {fansub.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {fansub.description.length > 80
                  ? fansub.description.slice(0, 80) + '...'
                  : fansub.description}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">אין דירוג עדיין</span>
            {translationCount !== null && (
              <Badge variant="secondary">{translationCount} תרגומים</Badge>
            )}
            {yearsActive !== null && yearsActive > 0 && (
              <span className="text-xs text-muted-foreground">
                פעילים {yearsActive} שנים
              </span>
            )}
          </div>
        </CardContent>
      </Link>
      {/* Platform buttons outside the Link to avoid nested anchors */}
      <CardContent className="pt-0 pb-4">
        <div className="flex flex-wrap gap-2">
          {fansub.website_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={fansub.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 me-1.5" aria-hidden />
                אתר
              </a>
            </Button>
          )}
          {fansub.telegram_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={fansub.telegram_url} target="_blank" rel="noopener noreferrer">
                <Send className="h-3.5 w-3.5 me-1.5" aria-hidden />
                טלגרם
              </a>
            </Button>
          )}
          {fansub.discord_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={fansub.discord_url} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-3.5 w-3.5 me-1.5" aria-hidden />
                דיסקורד
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
