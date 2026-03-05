'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { fansubProfileSchema } from '@/lib/validations/fansub'

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

export type UpsertFansubResult = { success: true; fansubId: string } | { success: false; error: string }

export async function upsertFansubProfile(
  values: Record<string, unknown>
): Promise<UpsertFansubResult> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'לא מאומת. יש להתחבר קודם.' }

  const parsed = fansubProfileSchema.safeParse(values)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { success: false, error: firstError ?? 'נתונים לא תקינים' }
  }

  const {
    name, logo_url, established_year, description,
    website_url, discord_url, telegram_url,
    activity_status, translation_domains, flagship_projects,
    is_recruiting, recruiting_roles, recruitment_contact,
    submitter_name, submitter_role, submitter_contact,
  } = parsed.data

  const clean = (v: string | undefined | null) => (!v || v.trim() === '' ? null : v.trim())

  const payload = {
    manager_uid: user.id,
    name,
    logo_url: clean(logo_url),
    established_year: established_year ?? null,
    description,
    website_url: clean(website_url),
    discord_url: clean(discord_url),
    telegram_url: clean(telegram_url),
    activity_status,
    translation_domains,
    flagship_projects: clean(flagship_projects),
    is_recruiting,
    recruiting_roles: is_recruiting ? (recruiting_roles ?? []) : [],
    recruitment_contact: is_recruiting ? clean(recruitment_contact) : null,
    submitter_name,
    submitter_role,
    submitter_contact,
  }

  // Check if this manager already has a group
  const { data: existing } = await supabase
    .from('fansub_groups')
    .select('id')
    .eq('manager_uid', user.id)
    .maybeSingle()

  let fansubId: string

  if (existing?.id) {
    const { error } = await supabase
      .from('fansub_groups')
      .update(payload)
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
    fansubId = existing.id
  } else {
    const { data: inserted, error } = await supabase
      .from('fansub_groups')
      .insert({ ...payload, status: 'pending' })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    fansubId = inserted.id
  }

  revalidatePath('/dashboard')
  revalidatePath(`/fansub/${fansubId}`)
  return { success: true, fansubId }
}

