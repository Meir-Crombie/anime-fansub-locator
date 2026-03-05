'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ratingSchema = z.object({
  fansub_id: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
})

export async function submitRating(data: unknown) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'יש להתחבר כדי לדרג' }

  const parsed = ratingSchema.safeParse(data)
  if (!parsed.success) return { error: 'נתוני דירוג לא תקינים' }

  const { fansub_id, score, review } = parsed.data

  const { error: ratingError } = await supabase
    .from('ratings')
    .upsert(
      { fansub_id, user_id: user.id, score, review },
      { onConflict: 'fansub_id,user_id' }
    )

  if (ratingError) {
    console.error('[submitRating]', ratingError.message)
    return { error: 'שגיאה בשמירת הדירוג' }
  }

  // Recalculate rating_total and rating_count
  const { data: allRatings } = await supabase
    .from('ratings')
    .select('score')
    .eq('fansub_id', fansub_id)

  if (allRatings) {
    const total = allRatings.reduce((sum, r) => sum + r.score, 0)
    await supabase
      .from('fansub_groups')
      .update({ rating_total: total, rating_count: allRatings.length })
      .eq('id', fansub_id)
  }

  revalidatePath(`/fansub/${fansub_id}`)
  return { error: null }
}

export async function deleteRating(fansubId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'יש להתחבר' }

  const parsedId = z.string().uuid().safeParse(fansubId)
  if (!parsedId.success) return { error: 'מזהה לא תקין' }

  await supabase
    .from('ratings')
    .delete()
    .eq('fansub_id', parsedId.data)
    .eq('user_id', user.id)

  // Recalculate
  const { data: allRatings } = await supabase
    .from('ratings')
    .select('score')
    .eq('fansub_id', parsedId.data)

  if (allRatings) {
    const total = allRatings.reduce((sum, r) => sum + r.score, 0)
    await supabase
      .from('fansub_groups')
      .update({ rating_total: total, rating_count: allRatings.length })
      .eq('id', parsedId.data)
  }

  revalidatePath(`/fansub/${parsedId.data}`)
  return { error: null }
}
