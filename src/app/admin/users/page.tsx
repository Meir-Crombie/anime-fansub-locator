import { createServerClient } from '@/lib/supabase/server'
import UserRoleManager from '@/components/admin/UserRoleManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = createServerClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .order('role', { ascending: false })

  const { data: fansubs } = await supabase
    .from('fansub_groups')
    .select('id, name, manager_uid')
    .eq('is_active', true)

  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? ''

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        <p className="text-muted-foreground text-sm mt-1">
          שנה תפקידים, שייך מנהלים לקבוצות
        </p>
      </div>
      <UserRoleManager users={users ?? []} fansubs={fansubs ?? []} currentUserId={currentUserId} />
    </div>
  )
}
