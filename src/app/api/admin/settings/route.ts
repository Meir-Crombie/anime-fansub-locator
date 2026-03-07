import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: parsed.data.key, value: parsed.data.value })

  if (error) {
    console.error('[/api/admin/settings]', error.message)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
