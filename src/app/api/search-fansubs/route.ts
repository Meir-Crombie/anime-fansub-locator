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

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('search_fansubs', {
    search_query: parsed.data.query.trim(),
  })

  if (error) {
    console.error('[/api/search-fansubs]', error.message)
    return NextResponse.json(
      { data: null, error: 'שגיאת שרת' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: data ?? [], error: null }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
