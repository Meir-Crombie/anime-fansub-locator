import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import type { Route } from 'next'
import { Film, Users, Languages, Search, FileText, ShieldCheck } from 'lucide-react'
import InactivitySettings from '@/components/admin/InactivitySettings'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const supabase = createServerClient()

  const [
    { count: userCount },
    { count: animeCount },
    { count: fansubCount },
    { count: translationCount },
    { count: pendingAppCount },
    { count: unresolvedSearchCount },
    { data: topSearches },
    { data: recentTranslations },
    { data: recentUsers },
    { data: pendingApps },
    { data: thresholdRow },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('animes').select('*', { count: 'exact', head: true }),
    supabase.from('fansub_groups').select('*', { count: 'exact', head: true }),
    supabase.from('translations').select('*', { count: 'exact', head: true }),
    supabase
      .from('fansub_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('search_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false),
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
    supabase
      .from('profiles')
      .select('id, display_name, role')
      .order('id', { ascending: false })
      .limit(5),
    supabase
      .from('fansub_applications')
      .select('id, form_data, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5),
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'inactivity_threshold_months')
      .maybeSingle(),
  ])

  const stats = [
    { label: 'משתמשים רשומים', value: userCount ?? 0, icon: Users, href: '/admin/users' as Route },
    { label: 'אנימות', value: animeCount ?? 0, icon: Film, href: '/admin/animes' as Route },
    { label: 'קבוצות', value: fansubCount ?? 0, icon: Users, href: '/admin/fansubs' as Route },
    { label: 'תרגומים', value: translationCount ?? 0, icon: Languages, href: '#' as Route },
    { label: 'בקשות ממתינות', value: pendingAppCount ?? 0, icon: FileText, href: '/admin/applications' as Route },
    { label: 'חיפושים ללא תשובה', value: unresolvedSearchCount ?? 0, icon: Search, href: '/admin/analytics' as Route },
  ]

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">סקירת מערכת</h1>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        {/* Recent Users */}
        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" aria-hidden />
                משתמשים אחרונים
              </CardTitle>
              <Link href="/admin/users" className="text-sm text-primary hover:underline">
                כל המשתמשים ←
              </Link>
            </CardHeader>
            <CardContent>
              {!recentUsers || recentUsers.length === 0 ? (
                <EmptyState message="אין משתמשים עדיין" />
              ) : (
                <ul className="space-y-2">
                  {recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="font-medium">
                        {u.display_name || 'משתמש'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${u.role === 'admin'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : u.role === 'manager'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-muted text-muted-foreground'}`}>
                        {u.role === 'admin' ? 'מנהל ראשי' : u.role === 'manager' ? 'מנהל קבוצה' : 'משתמש'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Pending Applications */}
        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" aria-hidden />
                בקשות ממתינות לאישור
                {(pendingAppCount ?? 0) > 0 && (
                  <span className="mr-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {pendingAppCount}
                  </span>
                )}
              </CardTitle>
              <Link href="/admin/applications" className="text-sm text-primary hover:underline">
                לכל הבקשות ←
              </Link>
            </CardHeader>
            <CardContent>
              {!pendingApps || pendingApps.length === 0 ? (
                <EmptyState message="אין בקשות ממתינות ✅" />
              ) : (
                <ul className="space-y-2">
                  {pendingApps.map((app) => {
                    const formData = app.form_data as Record<string, string> | null
                    return (
                      <li key={app.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div>
                          <p className="font-medium">{formData?.name || 'קבוצה ללא שם'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <Link href="/admin/applications" className="text-xs text-primary hover:underline">
                          לבדיקה
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

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

      {/* Inactivity Settings */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" aria-hidden />
              הגדרות פעילות קבוצות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InactivitySettings initialThreshold={Number(thresholdRow?.value ?? '6')} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
