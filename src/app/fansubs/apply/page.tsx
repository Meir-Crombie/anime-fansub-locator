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
    <main className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">הגשת קבוצה חדשה</h1>
      <p className="text-muted-foreground mb-6">
        מלא את הטופס ובקשתך תיבדק על ידי הנהלת האתר
      </p>
      <ApplicationForm fields={(fields ?? []) as FormField[]} />
    </main>
  )
}
