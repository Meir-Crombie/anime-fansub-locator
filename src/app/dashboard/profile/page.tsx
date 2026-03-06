import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import FansubProfileForm from '@/components/forms/FansubProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'פרופיל קבוצה | Fansub Hub',
  description: 'עריכת פרופיל קבוצת הפאנסאב שלך',
}

export default async function DashboardProfilePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch existing fansub for this manager (if any)
  const { data: fansub } = await supabase
    .from('fansub_groups')
    .select('*')
    .eq('manager_uid', user.id)
    .maybeSingle()

  const isEdit = !!fansub

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'עריכת פרופיל קבוצה' : 'רישום קבוצה חדשה'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit
            ? 'עדכן את פרטי קבוצת הפאנסאב שלך'
            : 'מלא את הטופס כדי לרשום את הקבוצה שלך באתר — הפרטים ייבדקו על ידי הנהלת האתר'}
        </p>
      </div>

      <FansubProfileForm defaultValues={fansub ?? undefined} />
    </main>
  )
}
