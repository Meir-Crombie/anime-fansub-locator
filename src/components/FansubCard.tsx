import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Send, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { FansubGroup } from '@/lib/types'

interface FansubCardProps {
  fansub: FansubGroup
}

export default function FansubCard({ fansub }: FansubCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 pb-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {fansub.logo_url ? (
            <Image
              src={fansub.logo_url}
              alt={fansub.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-lg">
              {fansub.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base truncate">
            <Link
              href={`/fansub/${fansub.id}`}
              className="hover:text-primary transition-colors"
            >
              {fansub.name}
            </Link>
          </CardTitle>
          {fansub.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {fansub.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
