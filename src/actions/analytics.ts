'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function logSearchQuery(query: string) {
  const trimmed = query.toLowerCase().trim()
  if (trimmed.length < 2) return

  const supabase = createServerClient()

  const { error } = await supabase.rpc('increment_search_count', {
    p_query: trimmed,
  })

  if (error) {
    console.error('[analytics] Failed to log search query:', error)
  }
}
