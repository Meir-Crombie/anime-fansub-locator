import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('get_all_genres')

  if (error) {
    console.error('[/api/genres]', error.message)
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 })
  }

  const genres = data?.map((row: { genre: string }) => row.genre) ?? []
  return NextResponse.json({ data: genres, error: null })
}
