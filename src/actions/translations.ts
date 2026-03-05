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
  notes: z.string().max(500).optional(),
})

const episodeProgressSchema = z.object({
  translation_id: z.string().uuid(),
  total_episodes: z.number().int().min(0).nullable().optional(),
  translated_episodes: z.number().int().min(0).default(0),
})

async function verifyManager(
  supabase: ReturnType<typeof createServerClient>,
  fansubId: string,
  userId: string
) {
  const { data: group } = await supabase
    .from('fansub_groups')
    .select('manager_uid')
    .eq('id', fansubId)
    .single()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (group?.manager_uid !== userId && profile?.role !== 'admin') {
    throw new Error('Forbidden: not your group')
  }
}

export async function upsertTranslation(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = upsertTranslationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  await verifyManager(supabase, parsed.data.fansub_id, user.id)

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

  const { data: t } = await supabase
    .from('translations')
    .select('fansub_id, anime_id')
    .eq('id', parsed.data)
    .single()
  if (!t) return { error: 'תרגום לא נמצא' }

  await verifyManager(supabase, t.fansub_id, user.id)

  await supabase.from('translations').delete().eq('id', parsed.data)

  revalidatePath(`/anime/${t.anime_id}`)
  revalidatePath('/dashboard')
  return { error: null }
}

export async function updateEpisodeProgress(data: unknown) {
  const parsed = episodeProgressSchema.safeParse(data)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get translation to verify manager
  const { data: translation } = await supabase
    .from('translations')
    .select('fansub_id, anime_id')
    .eq('id', parsed.data.translation_id)
    .single()

  if (!translation) return { error: 'תרגום לא נמצא' }

  await verifyManager(supabase, translation.fansub_id, user.id)

  const { error } = await supabase
    .from('episode_progress')
    .upsert(
      {
        translation_id: parsed.data.translation_id,
        total_episodes: parsed.data.total_episodes ?? null,
        translated_episodes: parsed.data.translated_episodes,
        last_episode_at: new Date().toISOString(),
      },
      { onConflict: 'translation_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/anime/${translation.anime_id}`)
  revalidatePath('/dashboard')
  return { error: null }
}
