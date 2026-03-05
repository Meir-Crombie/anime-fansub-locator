import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import type { Route } from 'next'
import { Film, Users, Languages, Search, FileText } from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = createServerClient()

  const [
    { count: animeCount },
    { count: fansubCount },
    { count: translationCount },
    { count: pendingAppCount },
    { data: topSearches },
    { data: recentTranslations },
  ] = await Promise.all([
    supabase.from('animes').select('*', { count: 'exact', head: true }),
    supabase.from('fansub_groups').select('*', { count: 'exact', head: true }),
    supabase.from('translations').select('*', { count: 'exact', head: true }),
    supabase
      .from('fansub_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('search_analytics')
      .select('query_string, search_count, resolved')
      .eq('resolved', false)
      .order('search_count', { ascending: false })
      .limit(5),
    supabase
      .from('translations')
      .select('id, status, updated_at, animes(title_he), fansub_groups(name)')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'אנימות', value: animeCount ?? 0, icon: Film, href: '/admin/animes' as Route },
    { label: 'קבוצות', value: fansubCount ?? 0, icon: Users, href: '/admin/fansubs' as Route },
    { label: 'תרגומים', value: translationCount ?? 0, icon: Languages, href: '#' as Route },
    { label: 'בקשות ממתינות', value: pendingAppCount ?? 0, icon: FileText, href: '/admin/applications' as Route },
  ]

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">סקירת מערכת</h1>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:border-primary transition-colors">
              <CardContent className="py-4 flex items-center gap-3">
                <stat.icon className="h-8 w-8 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Unresolved Searches */}
        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" aria-hidden />
                חיפושים ללא תוצאה
              </CardTitle>
              <Link href="/admin/analytics" className="text-sm text-primary hover:underline">
                הכל
              </Link>
            </CardHeader>
            <CardContent>
              {!topSearches || topSearches.length === 0 ? (
                <EmptyState message="אין חיפושים לא פתורים" />
              ) : (
                <ul className="space-y-2">
                  {topSearches.map((s) => (
                    <li key={s.query_string} className="flex items-center justify-between text-sm">
                      <span dir="auto">{s.query_string}</span>
                      <Badge variant="secondary">{s.search_count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent Translations */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Languages className="h-5 w-5" aria-hidden />
                תרגומים אחרונים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentTranslations || recentTranslations.length === 0 ? (
                <EmptyState message="אין תרגומים" />
              ) : (
                <ul className="space-y-2">
                  {recentTranslations.map((t) => {
                    const anime = t.animes as unknown as { title_he: string } | null
                    const fansub = t.fansub_groups as unknown as { name: string } | null
                    return (
                      <li key={t.id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <span className="font-medium">{anime?.title_he ?? '—'}</span>
                          <span className="text-muted-foreground mx-1">·</span>
                          <span className="text-muted-foreground">{fansub?.name ?? '—'}</span>
                        </div>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                          {t.status === 'completed' ? 'הושלם' : t.status === 'ongoing' ? 'בתרגום' : 'ננטש'}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
