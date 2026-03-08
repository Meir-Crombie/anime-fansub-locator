import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import ApplicationForm from './ApplicationForm'
import type { Metadata } from 'next'
import type { FormField } from '@/lib/types'

export const metadata: Metadata = {
  title: 'הגשת קבוצת פאנסאב | Fansub Hub',
  description: 'הגש בקשה להוסיף את קבוצת הפאנסאב שלך',
}

export default async function FansubApplyPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_name', 'fansub_registration')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <p className="text-xs tracking-widest mb-2 font-space-mono font-bold uppercase text-primary">
            הגשת קבוצה
          </p>
          <h1 className="text-2xl font-extrabold font-heebo text-foreground">
            הגשת קבוצה חדשה
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            מלא את הטופס ובקשתך תיבדק על ידי הנהלת האתר
          </p>
        </div>
        <ApplicationForm fields={(fields ?? []) as FormField[]} />
      </div>
    </main>
  )
}
