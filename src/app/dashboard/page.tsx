import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdminRole = profile?.role === 'admin' || profile?.role === 'super_admin'

  // First try groups the user directly manages
  const { data: ownFansubs } = await supabase
    .from('fansub_groups')
    .select(`
      *,
      translations (
        id, status, platform, direct_link, notes, updated_at,
        episode_progress (translated_episodes, total_episodes, last_episode_at),
        animes (id, title_he, title_en, cover_image_url)
      ),
      announcements (id, title, type, created_at, is_published)
    `)
    .eq('manager_uid', user!.id)

  let allFansubs = ownFansubs ?? []

  // For admin/super_admin with no own groups — load all active groups
  if (allFansubs.length === 0 && isAdminRole) {
    const { data: allGroups } = await supabase
      .from('fansub_groups')
      .select(`
        *,
        translations (
          id, status, platform, direct_link, notes, updated_at,
          episode_progress (translated_episodes, total_episodes, last_episode_at),
          animes (id, title_he, title_en, cover_image_url)
        ),
        announcements (id, title, type, created_at, is_published)
      `)
      .eq('is_active', true)
      .order('name')

    allFansubs = allGroups ?? []
  }

  if (allFansubs.length === 0) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        <p className="text-muted-foreground">
          לא נמצאה קבוצת פאנסאב המשויכת לחשבונך.
        </p>
        <Button asChild>
          <Link href={'/dashboard/profile' as never}>
            <Plus className="h-4 w-4 me-2" aria-hidden />
            רשום קבוצה חדשה
          </Link>
        </Button>
      </main>
    )
  }

  // Use first fansub as default
  const fansub = allFansubs[0]

  // Get ratings for stats
  const { data: allRatingsData } = await supabase
    .from('ratings')
    .select('score')
    .eq('fansub_id', fansub.id)

  const { data: ratings } = await supabase
    .from('ratings')
    .select('score, review, created_at')
    .eq('fansub_id', fansub.id)
    .order('created_at', { ascending: false })
    .limit(5)

  type TranslationRow = {
    id: string
    status: 'ongoing' | 'completed' | 'dropped'
    platform: 'website' | 'telegram' | 'discord' | 'youtube'
    direct_link: string
    notes: string | null
    updated_at: string
    episode_progress: { translated_episodes: number; total_episodes: number | null; last_episode_at: string | null }[] | null
    animes: { id: string; title_he: string; title_en: string; cover_image_url: string | null } | null
  }

  type AnnouncementRow = {
    id: string
    title: string
    type: string
    created_at: string
    is_published: boolean
  }

  const translations = (fansub.translations ?? []) as unknown as TranslationRow[]
  const announcements = (fansub.announcements ?? []) as unknown as AnnouncementRow[]

  const completedCount = translations.filter((t) => t.status === 'completed').length
  const ongoingCount = translations.filter((t) => t.status === 'ongoing').length

  const ratingCount = allRatingsData?.length ?? 0
  const ratingTotal = allRatingsData?.reduce((sum, r) => sum + r.score, 0) ?? 0
  const avgRating = ratingCount > 0
    ? (ratingTotal / ratingCount).toFixed(1)
    : null

  // Build group names for multi-group switcher
  const groupOptions = allFansubs.map((f) => ({ id: f.id, name: f.name }))

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        {allFansubs.length > 1 ? (
          <p className="text-sm text-muted-foreground mt-1">
            מנהל {allFansubs.length} קבוצות — מציג: {fansub.name}
          </p>
        ) : (
          <p className="text-muted-foreground">{fansub.name}</p>
        )}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{translations.length}</p>
            <p className="text-xs text-muted-foreground">סה&ldquo;כ תרגומים</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground">הושלמו</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{ongoingCount}</p>
            <p className="text-xs text-muted-foreground">בתרגום</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" aria-hidden />
              <span className="text-2xl font-bold">{avgRating ?? '-'}</span>
            </div>
            <p className="text-xs text-muted-foreground">{ratingCount} דירוגים</p>
          </CardContent>
        </Card>
      </section>

      <DashboardClient fansub={fansub} translations={translations} announcements={announcements} />

      {/* Latest Reviews */}
      {ratings && ratings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">ביקורות אחרונות</h2>
          <div className="space-y-2">
            {ratings.map((r, i) => (
              <Card key={i}>
                <CardContent className="py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= r.score
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                  {r.review && <p className="text-sm">{r.review}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
