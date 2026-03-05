import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json(
      { data: null, error: 'שאילתה לא תקינה' },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('get_similar_searches', {
    p_query: q.toLowerCase().trim(),
  })

  if (error) {
    console.error('[/api/similar-searches]', error.message)
    return NextResponse.json(
      { data: null, error: 'שגיאת שרת' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
