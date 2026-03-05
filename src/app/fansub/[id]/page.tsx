import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { TranslationBadge } from '@/components/TranslationBadge'
import EmptyState from '@/components/EmptyState'
import RatingWidget from '@/components/RatingWidget'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Send, MessageSquare, Star, Calendar, Megaphone } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

interface FansubPageProps {
  params: { id: string }
}

const ANNOUNCEMENT_TYPE_LABELS: Record<string, string> = {
  episode_release: 'פרק חדש',
  new_project: 'פרויקט חדש',
  completed: 'הושלם',
  general: 'כללי',
}

export async function generateMetadata({ params }: FansubPageProps): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: fansub } = await supabase
    .from('fansub_groups')
    .select('name, description')
    .eq('id', params.id)
    .single()

  if (!fansub) return { title: 'קבוצת פאנסאב לא נמצאה' }

  return {
    title: `${fansub.name} | Fansub Hub`,
    description: fansub.description ?? `דף קבוצת הפאנסאב ${fansub.name}`,
  }
}

export default async function FansubPage({ params }: FansubPageProps) {
  const supabase = createServerClient()

  const { data: fansub, error } = await supabase
    .from('fansub_groups')
    .select(`
      *,
      translations (
        id, status, platform, direct_link, notes, updated_at,
        episode_progress (translated_episodes, total_episodes, last_episode_at),
        animes (id, title_he, title_en, cover_image_url, genres)
      ),
      announcements (
        id, title, content, type, created_at,
        animes (title_he)
      )
    `)
    .eq('id', params.id)
    .eq('status', 'approved')
    .single()

  if (error || !fansub) notFound()

  type TranslationRow = {
    id: string
    status: 'ongoing' | 'completed' | 'dropped'
    platform: 'website' | 'telegram' | 'discord' | 'youtube'
    direct_link: string
    notes: string | null
    updated_at: string
    episode_progress: { translated_episodes: number; total_episodes: number | null; last_episode_at: string | null }[] | null
    animes: { id: string; title_he: string; title_en: string; cover_image_url: string | null; genres: string[] } | null
  }

  type AnnouncementRow = {
    id: string
    title: string
    content: string
    type: string
    created_at: string
    animes: { title_he: string } | null
  }

  const translations = (fansub.translations ?? []) as unknown as TranslationRow[]
  const announcements = (fansub.announcements ?? []) as unknown as AnnouncementRow[]

  const completedCount = translations.filter((t) => t.status === 'completed').length
  const ongoingCount = translations.filter((t) => t.status === 'ongoing').length
  const droppedCount = translations.filter((t) => t.status === 'dropped').length

  const avgRating = fansub.rating_count > 0
    ? (fansub.rating_total / fansub.rating_count).toFixed(1)
    : null

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* Hero Section */}
      <section className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
          {fansub.logo_url ? (
            <Image
              src={fansub.logo_url}
              alt={fansub.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
              {fansub.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <h1 className="text-3xl font-bold">{fansub.name}</h1>
          {fansub.description && (
            <p className="text-muted-foreground">{fansub.description}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge variant="default" className="bg-green-600">{completedCount} הושלמו</Badge>
            <Badge variant="default" className="bg-yellow-600">{ongoingCount} בתרגום</Badge>
            <Badge variant="destructive">{droppedCount} הופסקו</Badge>
            {avgRating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" aria-hidden />
                <span className="font-medium">{avgRating}</span>
                <span className="text-muted-foreground">({fansub.rating_count} דירוגים)</span>
              </div>
            )}
            {fansub.founded_at && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>פעילים מאז {formatDate(fansub.founded_at)}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
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
        </div>
      </section>

      {/* Rating Widget */}
      <RatingWidget fansubId={params.id} />

      {/* Translations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">תרגומים ({translations.length})</h2>
        <FansubTranslationTabs translations={translations} />
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5" aria-hidden />
            עדכונים אחרונים
          </h2>
          <div className="space-y-3">
            {announcements.slice(0, 5).map((a) => (
              <Card key={a.id}>
                <CardContent className="py-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{ANNOUNCEMENT_TYPE_LABELS[a.type] ?? a.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                  </div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                  {a.animes && (
                    <p className="text-xs text-muted-foreground">אנימה: {a.animes.title_he}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

// Translation tabs as a simple server-rendered section
function FansubTranslationTabs({ translations }: { translations: Array<{
  id: string
  status: string
  platform: 'website' | 'telegram' | 'discord' | 'youtube'
  direct_link: string
  notes: string | null
  episode_progress: { translated_episodes: number; total_episodes: number | null }[] | null
  animes: { id: string; title_he: string; title_en: string; cover_image_url: string | null } | null
}> }) {
  if (translations.length === 0) {
    return <EmptyState message="אין תרגומים עדיין" />
  }

  return (
    <div className="space-y-3">
      {translations.map((t) => {
        if (!t.animes) return null
        const progress = t.episode_progress?.[0]
        return (
          <Card key={t.id}>
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <div className="relative h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-muted">
                {t.animes.cover_image_url ? (
                  <Image
                    src={t.animes.cover_image_url}
                    alt={t.animes.title_he}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[8px] text-muted-foreground">
                    🎬
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/anime/${t.animes.id}`} className="font-medium hover:text-primary transition-colors">
                  {t.animes.title_he}
                </Link>
                <p className="text-xs text-muted-foreground">{t.animes.title_en}</p>
              </div>
              <TranslationBadge status={t.status as 'ongoing' | 'completed' | 'dropped'} platform={t.platform} />
              {progress && (
                <span className="text-xs text-muted-foreground">
                  פרק {progress.translated_episodes}
                  {progress.total_episodes ? ` מתוך ${progress.total_episodes}` : ''}
                </span>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href={t.direct_link} target="_blank" rel="noopener noreferrer">
                  צפייה
                </a>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
