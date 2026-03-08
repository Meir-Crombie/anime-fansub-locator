import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

  const supabase = createServerClient()

  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_random_anime_filtered', {
    p_genres:     genres?.length ? genres : null,
    p_min_ep:     min_ep     ?? null,
    p_max_ep:     max_ep     ?? null,
    p_min_season: min_season ?? null,
    p_max_season: max_season ?? null,
  })

  if (!rpcError) {
    const result = Array.isArray(rpcData) ? rpcData[0] : rpcData
    if (!result) return NextResponse.json({ data: null, error: 'no_results' }, { status: 404 })
    return NextResponse.json({ data: result, error: null }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Fallback: count + random offset
  console.warn('[/api/randomize] RPC fallback:', rpcError.message)

  const { count } = await supabase
    .from('animes')
    .select('*', { count: 'exact', head: true })

  if (!count || count === 0) {
    return NextResponse.json({ data: null, error: 'no_results' }, { status: 404 })
  }

  const randomOffset = Math.floor(Math.random() * count)
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('animes')
    .select('id, title_he, title_en')
    .range(randomOffset, randomOffset)

  if (fallbackError || !fallbackData?.[0]) {
    console.error('[/api/randomize] Fallback error:', fallbackError?.message)
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ data: fallbackData[0], error: null }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
