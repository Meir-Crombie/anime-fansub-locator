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

  // Find all fansub groups this user manages
  const { data: ownFansubs } = await supabase
    .from('fansub_groups')
    .select('id, name')
    .eq('manager_uid', user.id)

  const ownFansubList = (ownFansubs ?? []) as { id: string; name: string }[]

  // If manager has exactly one group, go directly to the form
  if (ownFansubList.length === 1) {
    return <GroupManagerForm fansubId={ownFansubList[0].id} fansubName={ownFansubList[0].name} />
  }

  // If manager has multiple groups, let them pick
  if (ownFansubList.length > 1) {
    return <FansubSelector fansubs={ownFansubList} />
  }

  // Admin/super_admin without own group — let them pick any active group
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
