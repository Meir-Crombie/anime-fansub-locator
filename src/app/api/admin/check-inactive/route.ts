import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST() {
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

  const { data, error } = await supabase.rpc('update_inactive_groups')
  if (error) {
    console.error('[/api/admin/check-inactive]', error.message)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }

  revalidatePath('/fansubs')
  revalidatePath('/')

  return NextResponse.json({ count: data ?? 0 })
}
