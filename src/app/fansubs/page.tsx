import { createServerClient } from '@/lib/supabase/server'
import FansubsLoadMore from '@/components/FansubsLoadMore'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'קבוצות הפאנסאב | Fansub Hub',
  description: 'כל קבוצות הפאנסאב הישראליות',
}

export const dynamic = 'force-dynamic'

export default async function FansubsPage() {
  const supabase = createServerClient()

  const { data: fansubs } = await supabase
    .from('fansub_groups')
    .select('*, translations(count)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 11)

  const { count } = await supabase
    .from('fansub_groups')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const totalCount = count ?? 0
  const typedFansubs = (fansubs ?? []) as (typeof fansubs extends (infer T)[] | null ? T : never)[]

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">קבוצות הפאנסאב</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount > 0 ? `${totalCount} קבוצות פעילות` : 'אין קבוצות עדיין'}
          </p>
        </div>
        <Button asChild>
          <Link href="/fansubs/apply">
            <Plus className="h-4 w-4 me-2" aria-hidden />
            הגש קבוצה חדשה
          </Link>
        </Button>
      </div>

      {typedFansubs.length === 0 ? (
        <EmptyState message="טרם אושרו קבוצות פאנסאב" />
      ) : (
        <FansubsLoadMore initialFansubs={typedFansubs as never[]} totalCount={totalCount} />
      )}
    </main>
  )
}
