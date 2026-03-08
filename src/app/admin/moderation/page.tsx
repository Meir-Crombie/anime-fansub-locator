import { createServerClient } from '@/lib/supabase/server'
import ModerationList from './ModerationList'

export const dynamic = 'force-dynamic'

export default async function AdminModerationPage() {
  const supabase = createServerClient()

  // moderation_requests table not yet in generated types — use untyped query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untypedClient = supabase as any
  const { data: requests, error } = await untypedClient
    .from('moderation_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">בקשות פיקוח</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  const typedRequests = ((requests ?? []) as unknown) as {
    id: string
    reported_item_id: string
    item_type: string
    reason: string
    status: string
    created_at: string
  }[]

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">בקשות פיקוח ({typedRequests.length})</h1>
      <ModerationList requests={typedRequests} />
    </main>
  )
}
