import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState'
import type { SearchAnalytic } from '@/lib/types'

export default async function AdminAnalyticsPage() {
  const supabase = createServerClient()

  const { data: analytics, error } = await supabase
    .from('search_analytics')
    .select('*')
    .order('search_count', { ascending: false })
    .limit(50)

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
        <div className="space-y-2">
          {typedAnalytics.map((item) => (
            <Card key={item.query_string}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium" dir="auto">
                    {item.query_string}
                  </span>
                  {item.resolved && (
                    <Badge variant="default" className="bg-green-600">טופל</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{item.search_count} חיפושים</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
