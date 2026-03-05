'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import FansubCard from '@/components/FansubCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { FansubGroup } from '@/lib/types'

type FansubWithCount = FansubGroup & { translations: { count: number }[] }

interface FansubsLoadMoreProps {
  initialFansubs: FansubWithCount[]
  totalCount: number
}

const PAGE_SIZE = 12

export default function FansubsLoadMore({ initialFansubs, totalCount }: FansubsLoadMoreProps) {
  const [fansubs, setFansubs] = useState<FansubWithCount[]>(initialFansubs)
  const [isLoading, setIsLoading] = useState(false)
  const hasMore = fansubs.length < totalCount

  async function loadMore() {
    setIsLoading(true)
    const supabase = createClient()
    const offset = fansubs.length

    const { data } = await supabase
      .from('fansub_groups')
      .select('*, translations(count)')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (data) {
      setFansubs((prev) => [...prev, ...(data as unknown as FansubWithCount[])])
    }
    setIsLoading(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fansubs.map((fansub) => (
          <FansubCard key={fansub.id} fansub={fansub} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMore} disabled={isLoading} variant="outline" size="lg">
            {isLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden />}
            טען עוד
          </Button>
        </div>
      )}
    </>
  )
}
