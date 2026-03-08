import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import GroupManagerForm from '@/components/forms/GroupManagerForm'
import FansubSelector from './FansubSelector'

export default async function DashboardEditPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const ALLOWED_ROLES = ['manager', 'admin', 'super_admin']
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/dashboard')
  }

  // Try to find the user's own fansub group
  const { data: ownFansubs } = await supabase
    .from('fansub_groups')
    .select('id, name')
    .eq('manager_uid', user.id)
    .limit(1)

  const ownFansub = ownFansubs?.[0] ?? null

  if (ownFansub) {
    return <GroupManagerForm fansubId={ownFansub.id} fansubName={ownFansub.name} />
  }

  // Admin without own group — let them pick any active group
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    const { data: allFansubs } = await supabase
      .from('fansub_groups')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    const fansubList = (allFansubs ?? []) as { id: string; name: string }[]

    if (fansubList.length === 0) {
      redirect('/dashboard')
    }

    return <FansubSelector fansubs={fansubList} />
  }

  redirect('/dashboard')
}
