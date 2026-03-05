'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const createAnimeSchema = z.object({
  title_he: z.string().min(1).max(255),
  title_en: z.string().min(1).max(255),
  title_romaji: z.string().max(255).optional(),
  synopsis: z.string().optional(),
  cover_image_url: z.string().url().max(512).optional(),
  genres: z.array(z.string()).default([]),
  mal_id: z.number().int().positive().optional(),
})

const updateAnimeSchema = createAnimeSchema.extend({
  id: z.string().uuid(),
})

export async function createAnime(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const raw = Object.fromEntries(formData)
  const genres = formData.get('genres')
  const parsed = createAnimeSchema.safeParse({
    ...raw,
    genres: typeof genres === 'string' ? genres.split(',').filter(Boolean) : [],
    mal_id: raw.mal_id ? Number(raw.mal_id) : undefined,
  })

  if (!parsed.success) return { error: parsed.error.flatten() }

  const { error } = await supabase.from('animes').insert(parsed.data)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/animes')
  return { error: null }
}

export async function updateAnime(formData: FormData) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const raw = Object.fromEntries(formData)
  const genres = formData.get('genres')
  const parsed = updateAnimeSchema.safeParse({
    ...raw,
    genres: typeof genres === 'string' ? genres.split(',').filter(Boolean) : [],
    mal_id: raw.mal_id ? Number(raw.mal_id) : undefined,
  })

  if (!parsed.success) return { error: parsed.error.flatten() }

  const { id, ...data } = parsed.data
  const { error } = await supabase.from('animes').update(data).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath(`/anime/${id}`)
  revalidatePath('/admin/animes')
  return { error: null }
}

export async function deleteAnime(id: string) {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('animes').delete().eq('id', parsed.data)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/animes')
  return { error: null }
}
