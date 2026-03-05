import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()

  const { data, error } = await supabase.rpc('get_random_anime')

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { data: null, error: 'לא נמצאה אנימה' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: data[0], error: null })
}
