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
