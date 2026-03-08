'use server'

import { createServerClient } from '@/lib/supabase/server'
import { userSubmissionFullSchema } from '@/lib/validations/submission'

export async function createUserSubmission(formData: Record<string, unknown>) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = userSubmissionFullSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { error } = await supabase.from('user_submissions').insert({
    anime_name: parsed.data.anime_name.trim(),
    anime_name_en: parsed.data.anime_name_en?.trim() ?? null,
    translator_name: parsed.data.translator_name.trim(),
    translation_url: parsed.data.translation_url.trim(),
    platform_type: parsed.data.platform_type,
    status: parsed.data.status,
    description: parsed.data.description ?? null,
    language_quality: parsed.data.language_quality ?? null,
    cover_image_url: parsed.data.cover_image_url?.trim() || null,
    genres: parsed.data.genres ?? [],
    credits: parsed.data.credits?.trim() || null,
    fansub_name_custom: parsed.data.fansub_name_custom?.trim() || null,
    submitted_by: user.id,
    is_verified: false,
  })

  if (error) throw new Error(error.message)

  return { error: null }
}

export async function approveSubmission(submissionId: string) {
  const { z } = await import('zod')
  const parsed = z.string().uuid().safeParse(submissionId)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }

  // Fetch the full submission data
  const { data: submission, error: fetchErr } = await supabase
    .from('user_submissions')
    .select('*')
    .eq('id', parsed.data)
    .single()

  if (fetchErr || !submission) return { error: 'דיווח לא נמצא' }

  // Extract extra fields that may not be in strict types
  const sub = submission as Record<string, unknown>
  const coverImageUrl = (sub.cover_image_url as string | null) || null
  const genres = (sub.genres as string[] | null) ?? []

  // 1. Check if anime already exists by matching names
  const { data: existingAnime } = await supabase
    .from('animes')
    .select('id, cover_image_url, genres')
    .or(`title_he.ilike.${submission.anime_name},title_en.ilike.${submission.anime_name_en ?? submission.anime_name}`)
    .limit(1)
    .maybeSingle()

  let animeId: string

  if (existingAnime) {
    animeId = existingAnime.id
    // Update cover image and genres if they're currently empty
    const updates: Record<string, unknown> = {}
    if (!existingAnime.cover_image_url && coverImageUrl) {
      updates.cover_image_url = coverImageUrl
    }
    if ((!existingAnime.genres || existingAnime.genres.length === 0) && genres.length > 0) {
      updates.genres = genres
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('animes').update(updates).eq('id', animeId)
    }
  } else {
    // Create new anime entry with all available data
    const { data: newAnime, error: animeErr } = await supabase
      .from('animes')
      .insert({
        title_he: submission.anime_name,
        title_en: submission.anime_name_en ?? submission.anime_name,
        cover_image_url: coverImageUrl,
        genres,
      })
      .select('id')
      .single()

    if (animeErr || !newAnime) return { error: 'שגיאה ביצירת אנימה: ' + (animeErr?.message ?? '') }
    animeId = newAnime.id
  }

  // 2. Try to find fansub group by name — only link if exists, don't create new ones
  const fansubName = (submission as Record<string, unknown>).fansub_name_custom as string | null || submission.translator_name
  const { data: existingFansub } = await supabase
    .from('fansub_groups')
    .select('id')
    .ilike('name', fansubName)
    .limit(1)
    .maybeSingle()

  // 3. If fansub found, create a proper translation entry
  if (existingFansub) {
    // Map status: 'unknown' → 'ongoing'
    const statusMap: Record<string, string> = { ongoing: 'ongoing', completed: 'completed', unknown: 'ongoing', dropped: 'dropped' }
    const dbStatus = (statusMap[submission.status] ?? 'ongoing') as 'ongoing' | 'completed' | 'dropped'

    // Map platform: 'other' → 'website'
    const platformMap: Record<string, string> = { website: 'website', telegram: 'telegram', discord: 'discord', youtube: 'youtube', other: 'website' }
    const dbPlatform = (platformMap[submission.platform_type] ?? 'website') as 'website' | 'telegram' | 'discord' | 'youtube'

    await supabase
      .from('translations')
      .upsert({
        anime_id: animeId,
        fansub_id: existingFansub.id,
        status: dbStatus,
        platform: dbPlatform,
        direct_link: submission.translation_url,
        notes: submission.description ?? null,
      }, { onConflict: 'anime_id,fansub_id,platform' })
  }
  // If no fansub found — the verified submission itself will appear on the anime page

  // 4. Mark submission as verified
  const { error } = await supabase
    .from('user_submissions')
    .update({ is_verified: true })
    .eq('id', parsed.data)

  if (error) return { error: error.message }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/submissions')
  revalidatePath('/')
  revalidatePath(`/anime/${animeId}`)
  revalidatePath('/fansubs')
  return { error: null }
}

export async function deleteSubmission(submissionId: string) {
  const { z } = await import('zod')
  const parsed = z.string().uuid().safeParse(submissionId)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }

  const { error } = await supabase
    .from('user_submissions')
    .delete()
    .eq('id', parsed.data)

  if (error) return { error: error.message }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/submissions')
  return { error: null }
}

export async function reprocessSubmission(submissionId: string) {
  const { z } = await import('zod')
  const parsed = z.string().uuid().safeParse(submissionId)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }

  // Un-verify first
  await supabase
    .from('user_submissions')
    .update({ is_verified: false })
    .eq('id', parsed.data)

  // Re-approve with the fixed logic
  return approveSubmission(parsed.data)
}
