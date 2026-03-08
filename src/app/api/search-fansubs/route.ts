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
  const pattern = `%${parsed.data.query.toLowerCase().trim()}%`

  const { data, error } = await supabase
    .from('fansub_groups')
    .select('id, name, logo_url, description, translations(count)')
    .eq('is_active', true)
    .ilike('name', pattern)
    .limit(10)

  if (error) {
    console.error('[search-fansubs] Query error:', error)
    return NextResponse.json(
      { data: null, error: 'שגיאת שרת' },
      { status: 500 }
    )
  }

  const results = (data ?? []).map((fg) => {
    const countArr = fg.translations as unknown as { count: number }[]
    return {
      id: fg.id,
      name: fg.name,
      logo_url: fg.logo_url,
      description: fg.description,
      translation_count: countArr?.[0]?.count ?? 0,
    }
  })

  return NextResponse.json({ data: results, error: null }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
