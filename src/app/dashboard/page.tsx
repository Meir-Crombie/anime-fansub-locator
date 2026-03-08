import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
        animes (id, title_he, title_en, cover_image_url, genres, synopsis)
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
          animes (id, title_he, title_en, cover_image_url, genres, synopsis)
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

  type TranslationRow = {
    id: string
    status: 'ongoing' | 'completed' | 'dropped'
    platform: 'website' | 'telegram' | 'discord' | 'youtube'
    direct_link: string
    notes: string | null
    updated_at: string
    episode_progress: { translated_episodes: number; total_episodes: number | null; last_episode_at: string | null }[] | null
    animes: { id: string; title_he: string; title_en: string; cover_image_url: string | null; genres: string[]; synopsis: string | null } | null
  }

  type AnnouncementRow = {
    id: string
    title: string
    type: string
    created_at: string
    is_published: boolean
  }

  type RatingRow = {
    score: number
    review: string | null
    created_at: string
  }

  type GroupData = {
    fansub: typeof allFansubs[number]
    translations: TranslationRow[]
    announcements: AnnouncementRow[]
    ratings: RatingRow[]
    ratingCount: number
    avgRating: string | null
  }

  // Build data map for all groups
  const groupDataMap: Record<string, GroupData> = {}

  for (const f of allFansubs) {
    const { data: allRatingsData } = await supabase
      .from('ratings')
      .select('score')
      .eq('fansub_id', f.id)

    const { data: ratings } = await supabase
      .from('ratings')
      .select('score, review, created_at')
      .eq('fansub_id', f.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const ratingCount = allRatingsData?.length ?? 0
    const ratingTotal = allRatingsData?.reduce((sum, r) => sum + r.score, 0) ?? 0

    groupDataMap[f.id] = {
      fansub: f,
      translations: (f.translations ?? []) as unknown as TranslationRow[],
      announcements: (f.announcements ?? []) as unknown as AnnouncementRow[],
      ratings: (ratings ?? []) as RatingRow[],
      ratingCount,
      avgRating: ratingCount > 0 ? (ratingTotal / ratingCount).toFixed(1) : null,
    }
  }

  const groupOptions = allFansubs.map((f) => ({ id: f.id, name: f.name }))

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <DashboardClient
        allGroups={groupOptions}
        groupDataMap={groupDataMap}
        defaultGroupId={allFansubs[0].id}
      />
    </main>
  )
}
