import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schema = z.object({
  query: z.string().min(2).max(200),
})

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
  const searchQuery = parsed.data.query.toLowerCase().trim()
  const pattern = `%${searchQuery}%`

  const { data, error } = await supabase
    .from('animes')
    .select('id, title_he, title_en, title_romaji, cover_image_url, genres')
    .or(`title_he.ilike.${pattern},title_en.ilike.${pattern},title_romaji.ilike.${pattern}`)
    .limit(20)

  if (error) {
    console.error('[search] Query error:', error)
    return NextResponse.json(
      { data: null, error: 'החיפוש נכשל' },
      { status: 500 }
    )
  }

  const results = (data ?? []).map((a) => ({
    id: a.id,
    title_he: a.title_he,
    title_en: a.title_en,
    title_romaji: a.title_romaji,
    cover_image_url: a.cover_image_url,
    genres: a.genres ?? [],
  }))

  // Log unsatisfied searches to analytics
  if (results.length === 0) {
    try {
      await supabase.rpc('increment_search_count', { p_query: searchQuery })
    } catch {
      // Analytics logging is best-effort
    }
  }

  return NextResponse.json({ data: results, error: null }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
