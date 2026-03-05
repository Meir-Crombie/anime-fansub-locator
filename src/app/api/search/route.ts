import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  query: z.string().min(2).max(200),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: 'שאילתת חיפוש לא תקינה' },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()
  const searchQuery = parsed.data.query.toLowerCase().trim()

  const { data, error } = await supabase.rpc('search_animes', {
    search_query: searchQuery,
  })

  if (error) {
    console.error('[search] Supabase error:', error)
    return NextResponse.json(
      { data: null, error: 'החיפוש נכשל' },
      { status: 500 }
    )
  }

  // Log unsatisfied searches to analytics
  if (!data || data.length === 0) {
    await supabase.rpc('increment_search_count', {
      p_query: searchQuery,
    })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
