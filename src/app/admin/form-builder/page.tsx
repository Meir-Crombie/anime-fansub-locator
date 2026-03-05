import { createServerClient } from '@/lib/supabase/server'
import FormBuilder from './FormBuilder'
import type { Metadata } from 'next'
import type { FormField } from '@/lib/types'

export const metadata: Metadata = {
  title: 'עורך טופס | ניהול | Fansub Hub',
}

export default async function AdminFormBuilderPage() {
  const supabase = createServerClient()

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_name', 'fansub_registration')
    .order('sort_order')

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">עורך טופס</h1>
        <p className="text-muted-foreground mt-1">
          ניהול שדות טופס הרשמה לקבוצת פאנסאב
        </p>
      </div>
      <FormBuilder initialFields={(fields ?? []) as FormField[]} />
    </main>
  )
}
