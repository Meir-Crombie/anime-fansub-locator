'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const announcementSchema = z.object({
  fansub_id: z.string().uuid(),
  anime_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(5000),
  type: z.enum(['episode_release', 'new_project', 'completed', 'general']),
  is_published: z.boolean().default(true),
})

async function verifyFansubManager(fansubId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: group } = await supabase
    .from('fansub_groups')
    .select('manager_uid')
    .eq('id', fansubId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (group?.manager_uid !== user.id && profile?.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return { supabase, userId: user.id }
}

export async function createAnnouncement(data: unknown) {
  const parsed = announcementSchema.safeParse(data)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const { supabase } = await verifyFansubManager(parsed.data.fansub_id)

  const { error } = await supabase
    .from('announcements')
    .insert({
      ...parsed.data,
      anime_id: parsed.data.anime_id || null,
    })

  if (error) return { error: error.message }

  revalidatePath(`/fansub/${parsed.data.fansub_id}`)
  revalidatePath('/dashboard')
  return { error: null }
}

export async function toggleAnnouncementPublished(id: string, fansubId: string, currentValue: boolean) {
  const parsedId = z.string().uuid().safeParse(id)
  const parsedFansub = z.string().uuid().safeParse(fansubId)
  if (!parsedId.success || !parsedFansub.success) return { error: 'מזהה לא תקין' }

  const { supabase } = await verifyFansubManager(parsedFansub.data)

  const { error } = await supabase
    .from('announcements')
    .update({ is_published: !currentValue })
    .eq('id', parsedId.data)

  if (error) return { error: error.message }

  revalidatePath(`/fansub/${parsedFansub.data}`)
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteAnnouncement(id: string, fansubId: string) {
  const parsedId = z.string().uuid().safeParse(id)
  const parsedFansub = z.string().uuid().safeParse(fansubId)
  if (!parsedId.success || !parsedFansub.success) return { error: 'מזהה לא תקין' }

  const { supabase } = await verifyFansubManager(parsedFansub.data)

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', parsedId.data)

  if (error) return { error: error.message }

  revalidatePath(`/fansub/${parsedFansub.data}`)
  revalidatePath('/dashboard')
  return { error: null }
}
