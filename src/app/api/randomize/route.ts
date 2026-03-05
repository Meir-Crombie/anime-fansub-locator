import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  genres:     z.array(z.string()).optional(),
  min_ep:     z.number().int().min(1).optional(),
  max_ep:     z.number().int().min(1).optional(),
  min_season: z.number().int().min(1).optional(),
  max_season: z.number().int().min(1).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid filters' }, { status: 400 })
  }

  const { genres, min_ep, max_ep, min_season, max_season } = parsed.data

  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('get_random_anime_filtered', {
    p_genres:     genres?.length ? genres : null,
    p_min_ep:     min_ep     ?? null,
    p_max_ep:     max_ep     ?? null,
    p_min_season: min_season ?? null,
    p_max_season: max_season ?? null,
  })

  if (error) {
    console.error('[/api/randomize]', error.message)
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : data

  if (!result) {
    return NextResponse.json({ data: null, error: 'no_results' }, { status: 404 })
  }

  return NextResponse.json({ data: result, error: null })
}
