import { createServerClient } from '@/lib/supabase/server'
import EmptyState from '@/components/EmptyState'
import ApplicationReviewList from './ApplicationReviewList'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'בקשות ממתינות | ניהול | Fansub Hub',
}

export default async function AdminApplicationsPage() {
  const supabase = createServerClient()

  const { data: applications, error } = await supabase
    .from('fansub_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">בקשות ממתינות</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">בקשות ממתינות</h1>
        <p className="text-muted-foreground mt-1">
          {(applications?.length ?? 0) > 0
            ? `${applications!.length} בקשות ממתינות לאישור`
            : 'אין בקשות ממתינות'}
        </p>
      </div>

      {(applications?.length ?? 0) === 0 ? (
        <EmptyState message="אין בקשות ממתינות" />
      ) : (
        <ApplicationReviewList applications={applications!} />
      )}
    </main>
  )
}
