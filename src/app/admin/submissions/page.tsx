import { createServerClient } from '@/lib/supabase/server'
import EmptyState from '@/components/EmptyState'
import SubmissionReviewList from './SubmissionReviewList'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'דיווחי תרגום | ניהול | Fansub Hub',
}

export default async function AdminSubmissionsPage() {
  const supabase = createServerClient()

  const { data: submissions, error } = await supabase
    .from('user_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">דיווחי תרגום מהקהילה</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  const pending = submissions?.filter((s) => !s.is_verified) ?? []
  const verified = submissions?.filter((s) => s.is_verified) ?? []

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">דיווחי תרגום מהקהילה</h1>
        <p className="text-muted-foreground mt-1">
          {pending.length > 0
            ? `${pending.length} דיווחים ממתינים לאישור`
            : 'אין דיווחים ממתינים'}
          {verified.length > 0 && ` · ${verified.length} מאושרים`}
        </p>
      </div>

      {(submissions?.length ?? 0) === 0 ? (
        <EmptyState message="אין דיווחי תרגום מהקהילה" />
      ) : (
        <SubmissionReviewList submissions={submissions!} />
      )}
    </main>
  )
}
