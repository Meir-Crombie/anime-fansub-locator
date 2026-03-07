import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState'
import type { FansubGroup } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminFansubsPage() {
  const supabase = createServerClient()

  const { data: fansubs, error } = await supabase
    .from('fansub_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">ניהול קבוצות פאנסאב</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  const typedFansubs = (fansubs ?? []) as FansubGroup[]

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">ניהול קבוצות פאנסאב ({typedFansubs.length})</h1>

      {typedFansubs.length === 0 ? (
        <EmptyState message="אין קבוצות פאנסאב במאגר עדיין." />
      ) : (
        <div className="space-y-3">
          {typedFansubs.map((fansub) => (
            <Card key={fansub.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {fansub.name}
                  <Badge variant={fansub.is_active ? 'default' : 'secondary'}>
                    {fansub.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm text-muted-foreground">
                {fansub.description || 'ללא תיאור'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
