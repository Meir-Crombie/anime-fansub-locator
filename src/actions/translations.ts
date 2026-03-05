'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const upsertTranslationSchema = z.object({
  anime_id: z.string().uuid(),
  fansub_id: z.string().uuid(),
  status: z.enum(['ongoing', 'completed', 'dropped']),
  platform: z.enum(['website', 'telegram', 'discord', 'youtube']),
  direct_link: z.string().url(),
  notes: z.string().optional(),
})

export async function upsertTranslation(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = upsertTranslationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { error } = await supabase
    .from('translations')
    .upsert(parsed.data, {
      onConflict: 'anime_id,fansub_id,platform',
    })

  if (error) throw new Error(error.message)

  revalidatePath(`/anime/${parsed.data.anime_id}`)
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteTranslation(id: string) {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('translations')
    .delete()
    .eq('id', parsed.data)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  return { error: null }
}
