import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schema = z.object({ query: z.string().min(1).max(200) })

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: [], error: 'בקשה לא תקינה' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: [], error: 'שאילתה לא תקינה' }, { status: 400 })
  }

  const supabase = createServerClient()
  const pattern = `%${parsed.data.query.trim()}%`

  const { data, error } = await supabase
    .from('animes')
    .select('id, title_he, title_en')
    .or(`title_he.ilike.${pattern},title_en.ilike.${pattern},title_romaji.ilike.${pattern}`)
    .order('title_he')
    .limit(15)

  if (error) {
    console.error('[animes-autocomplete]', error)
    return NextResponse.json({ data: [], error: 'שגיאת חיפוש' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
