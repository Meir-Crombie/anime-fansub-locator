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
  const { error } = await supabase.from('animes').update(data).eq('id', id).select()
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


const updateAnimeDetailsSchema = z.object({
  anime_id: z.string().uuid(),
  cover_image_url: z.string().url().max(512).optional().or(z.literal('')),
  genres: z.array(z.string()).optional(),
  synopsis: z.string().max(2000).optional(),
  title_en: z.string().max(255).optional().or(z.literal('')),
})

export async function updateAnimeDetails(data: { anime_id: string; cover_image_url?: string; genres?: string[]; synopsis?: string; title_en?: string }) {
  const parsed = updateAnimeDetailsSchema.safeParse(data)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const updates: Record<string, unknown> = {}
  if (parsed.data.cover_image_url !== undefined) {
    updates.cover_image_url = parsed.data.cover_image_url || null
  }
  if (parsed.data.genres !== undefined) {
    updates.genres = parsed.data.genres
  }
  if (parsed.data.synopsis !== undefined) {
    updates.synopsis = parsed.data.synopsis || null
  }
  if (parsed.data.title_en !== undefined) {
    updates.title_en = parsed.data.title_en || null
  }

  if (Object.keys(updates).length === 0) return { error: null }

  const { error } = await supabase
    .from('animes')
    .update(updates)
    .eq('id', parsed.data.anime_id)
    .select()

  if (error) {
    console.error('Supabase updateAnimeDetails error:', error)
    return { error: error.message }
  }

  revalidatePath(`/anime/${parsed.data.anime_id}`)
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin/animes')
  return { error: null }
}
