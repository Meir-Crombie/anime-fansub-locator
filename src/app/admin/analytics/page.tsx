import { createServerClient } from '@/lib/supabase/server'
import EmptyState from '@/components/EmptyState'
import type { SearchAnalytic } from '@/lib/types'
import AnalyticsClient from './AnalyticsClient'

export default async function AdminAnalyticsPage() {
  const supabase = createServerClient()

  const { data: analytics, error } = await supabase
    .from('search_analytics')
    .select('*')
    .order('search_count', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">אנליטיקת חיפוש</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  const typedAnalytics = (analytics ?? []) as SearchAnalytic[]

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">רשימת משאלות - חיפושים</h1>
        <p className="text-muted-foreground mt-1">
          חיפושים שלא הניבו תוצאות, ממוינים לפי כמות
        </p>
      </div>

      {typedAnalytics.length === 0 ? (
        <EmptyState message="אין נתוני חיפוש עדיין." />
      ) : (
        <AnalyticsClient analytics={typedAnalytics} />
      )}
    </main>
  )
}
