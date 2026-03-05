'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitFansubApplication(formData: Record<string, unknown>) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'יש להתחבר כדי להגיש בקשה' }

  // Validate that the form data has at minimum the required 'name' field
  const nameVal = z.string().min(1).max(255).safeParse(formData.name)
  if (!nameVal.success) return { error: 'שם הקבוצה הוא שדה חובה' }

  const { error } = await supabase
    .from('fansub_applications')
    .insert({
      submitted_by: user.id,
      form_data: formData,
      status: 'pending' as const,
    })

  if (error) {
    console.error('[submitFansubApplication]', error.message)
    return { error: 'שגיאה בשליחת הבקשה' }
  }

  revalidatePath('/admin/applications')
  return { error: null }
}
