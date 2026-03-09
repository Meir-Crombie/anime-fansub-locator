'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { groupManagerFormSchema } from '@/lib/validations/submission'

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
  if (group?.manager_uid !== userId && !['admin', 'super_admin'].includes(profile?.role ?? '')) {
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
  revalidatePath(`/fansub/${parsed.data.fansub_id}`)
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
  revalidatePath(`/fansub/${t.fansub_id}`)
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
  revalidatePath(`/fansub/${translation.fansub_id}`)
  return { error: null }
}

export async function submitManagerTranslation(formData: Record<string, unknown>) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = groupManagerFormSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  // Determine fansub — accept fansub_id from form or find manager's own group
  let fansubId: string | null = null

  if (typeof formData.fansub_id === 'string' && formData.fansub_id) {
    fansubId = formData.fansub_id
  } else {
    const { data: fansubs } = await supabase
      .from('fansub_groups')
      .select('id')
      .eq('manager_uid', user.id)
      .limit(1)
    fansubId = fansubs?.[0]?.id ?? null
  }

  if (!fansubId) {
    return { error: { formErrors: ['לא נמצאה קבוצת פאנסאב משויכת. יש לבחור קבוצה.'], fieldErrors: {} } }
  }

  // Verify that the user can write to this fansub
  await verifyManager(supabase, fansubId, user.id)

  let animeId = parsed.data.anime_id

  // If other details like cover, genres, or english name are provided, prepare the anime data
  const { cover_image_url, genres, anime_name_en, anime_name } = parsed.data
  const animeData: Record<string, any> = {}

  if (anime_name) {
    animeData.title_he = anime_name
  }
  if (cover_image_url !== undefined) {
    animeData.cover_image_url = cover_image_url || null
  }
  if (genres !== undefined && genres.length > 0) {
    animeData.genres = genres
  }
  if (anime_name_en !== undefined) {
    animeData.title_en = anime_name_en || null
  }

  if (!animeId) {
    // Insert new anime
    const { data: newAnime, error: insertError } = await supabase
      .from('animes')
      .insert({
        title_he: anime_name,
        title_en: animeData.title_en ?? '', // title_en is required by DB schema
        ...animeData,
        // Since the manager provides it, we can assume it's approved immediately, or it needs manual logic.
        // Assuming we just insert directly for now.
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating new anime:', insertError)
      return {
        error: {
          formErrors: ['שגיאה ביצירת נתוני האנימה. נסה שוב.'],
          fieldErrors: {},
        },
      }
    }
    animeId = newAnime.id
  } else {
    // Update existing anime
    if (Object.keys(animeData).length > 0) {
      const { error: animeUpdateError } = await supabase
        .from('animes')
        .update(animeData)
        .eq('id', animeId)
        .select()

      if (animeUpdateError) {
        console.error('Error updating anime details:', animeUpdateError)
        // Non-critical, so we don't block the translation submission
      }
    }
  }

  // Build notes from optional fields
  const notesParts: string[] = []
  if (parsed.data.episode_range) notesParts.push(`פרקים: ${parsed.data.episode_range}`)
  if (parsed.data.release_date) notesParts.push(`תאריך: ${parsed.data.release_date}`)
  if (parsed.data.quality) notesParts.push(`איכות: ${parsed.data.quality}`)
  if (parsed.data.credits) notesParts.push(`קרדיטים: ${parsed.data.credits}`)
  if (parsed.data.notes) notesParts.push(parsed.data.notes)
  const combinedNotes = notesParts.length > 0 ? notesParts.join(' | ') : null

  // Map status — 'paused' is stored as 'dropped' in the DB enum
  const dbStatus = parsed.data.status === 'paused' ? 'dropped' : parsed.data.status
  const validStatus = dbStatus as 'ongoing' | 'completed' | 'dropped'

  // Map platform — use primary platform
  const primaryPlatform = parsed.data.platforms[0]

  const { error: translationError } = await supabase
    .from('translations')
    .upsert({
      anime_id: animeId,
      fansub_id: fansubId,
      status: validStatus,
      platform: primaryPlatform,
      direct_link: parsed.data.direct_link,
      notes: combinedNotes,
    }, {
      onConflict: 'anime_id,fansub_id,platform',
    })

  if (translationError) throw new Error(translationError.message)

  revalidatePath(`/anime/${animeId}`)
  revalidatePath('/dashboard')
  revalidatePath(`/fansub/${fansubId}`)
  revalidatePath('/')
  return { error: null, animeId }
}

const updateTranslationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['ongoing', 'completed', 'dropped']),
  platform: z.enum(['website', 'telegram', 'discord', 'youtube']),
  direct_link: z.string().url(),
  notes: z.string().max(500).optional().nullable(),
})

export async function updateTranslation(data: {
  id: string
  status: string
  platform: string
  direct_link: string
  notes?: string | null
}) {
  const parsed = updateTranslationSchema.safeParse(data)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: t } = await supabase
    .from('translations')
    .select('fansub_id, anime_id')
    .eq('id', parsed.data.id)
    .single()
  if (!t) return { error: 'תרגום לא נמצא' }

  await verifyManager(supabase, t.fansub_id, user.id)

  const { error } = await supabase
    .from('translations')
    .update({
      status: parsed.data.status,
      platform: parsed.data.platform,
      direct_link: parsed.data.direct_link,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath(`/anime/${t.anime_id}`)
  revalidatePath('/dashboard')
  revalidatePath(`/fansub/${t.fansub_id}`)
  return { error: null }
}
