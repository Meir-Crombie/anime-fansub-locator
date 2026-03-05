'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const updateFansubSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  website_url: z.string().url().max(512).optional().or(z.literal('')),
  telegram_url: z.string().url().max(512).optional().or(z.literal('')),
  discord_url: z.string().url().max(512).optional().or(z.literal('')),
  logo_url: z.string().url().max(512).optional().or(z.literal('')),
})

export async function updateFansubGroup(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const raw = Object.fromEntries(formData)
  const parsed = updateFansubSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { id, ...data } = parsed.data

  // Clean empty strings to null
  const cleaned = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { error } = await supabase
    .from('fansub_groups')
    .update(cleaned)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/fansub/${id}`)
  revalidatePath('/dashboard')
  return { error: null }
}
