import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schema = z.object({ query: z.string().min(2).max(200) })

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'בקשה לא תקינה' },
      { status: 400 }
    )
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: 'שאילתת חיפוש לא תקינה' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const searchQuery = parsed.data.query.trim()
  const normalized = searchQuery.toLowerCase()

  // Try RPC first (uses pg_trgm fuzzy search), fall back to ILIKE if unavailable
  let results: {
    id: string
    name: string
    logo_url: string | null
    description: string | null
    translation_count: number
    similarity_score: number
  }[] = []

  const { data: rpcData, error: rpcError } = await supabase.rpc('search_fansubs', {
    search_query: normalized,
  })

  if (!rpcError && rpcData) {
    results = rpcData
  } else {
    // Fallback: ILIKE substring search
    console.warn('[search-fansubs] RPC fallback — search_fansubs unavailable:', rpcError?.message)

    const pattern = `%${normalized}%`
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('fansub_groups')
      .select('id, name, logo_url, description, translations(count)')
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .limit(10)

    if (fallbackError) {
      console.error('[search-fansubs] Fallback query error:', fallbackError)
      return NextResponse.json(
        { data: null, error: 'שגיאת שרת' },
        { status: 500 }
      )
    }

    results = (fallbackData ?? []).map((fg) => {
      const countArr = fg.translations as unknown as { count: number }[]
      return {
        id: fg.id,
        name: fg.name,
        logo_url: fg.logo_url,
        description: fg.description,
        translation_count: countArr?.[0]?.count ?? 0,
        similarity_score: 1,
      }
    })
  }

  return NextResponse.json({ data: results, error: null }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
