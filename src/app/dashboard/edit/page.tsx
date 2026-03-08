import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import GroupManagerForm from '@/components/forms/GroupManagerForm'

export default async function DashboardEditPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: fansubs } = await supabase
    .from('fansub_groups')
    .select('id, name')
    .eq('manager_uid', user.id)
    .limit(1)

  const fansub = fansubs?.[0] ?? null

  if (!fansub) {
    redirect('/dashboard')
  }

  return <GroupManagerForm fansubId={fansub.id} fansubName={fansub.name} />
}
