'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return { supabase, userId: user.id }
}

const uuidSchema = z.string().uuid()

export async function setAdminRole(userId: string) {
  const parsed = uuidSchema.safeParse(userId)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const { supabase, userId: adminId } = await requireAdmin()

  if (adminId === parsed.data) {
    return { error: 'לא ניתן לשנות את התפקיד שלך' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', parsed.data)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { error: null }
}

export async function assignManagerToGroup(userId: string, fansubId: string) {
  const parsedUser = uuidSchema.safeParse(userId)
  const parsedFansub = uuidSchema.safeParse(fansubId)
  if (!parsedUser.success || !parsedFansub.success) {
    return { error: 'מזהים לא תקינים' }
  }

  const { supabase } = await requireAdmin()
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'manager' })
    .eq('id', parsedUser.data)
  if (profileError) return { error: profileError.message }

  const { error: groupError } = await supabase
    .from('fansub_groups')
    .update({ manager_uid: parsedUser.data })
    .eq('id', parsedFansub.data)
  if (groupError) return { error: groupError.message }

  revalidatePath('/admin')
  return { error: null }
}

export async function removeManagerRole(userId: string) {
  const parsed = uuidSchema.safeParse(userId)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const { supabase } = await requireAdmin()

  await supabase
    .from('fansub_groups')
    .update({ manager_uid: null })
    .eq('manager_uid', parsed.data)

  await supabase
    .from('profiles')
    .update({ role: 'viewer' })
    .eq('id', parsed.data)

  revalidatePath('/admin')
  return { error: null }
}

export async function approveApplication(applicationId: string) {
  const parsed = uuidSchema.safeParse(applicationId)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const { supabase, userId } = await requireAdmin()

  const { data: app } = await supabase
    .from('fansub_applications')
    .select('form_data, submitted_by')
    .eq('id', parsed.data)
    .single()

  if (!app) return { error: 'בקשה לא נמצאה' }

  const formData = app.form_data as Record<string, string>

  const { data: newGroup, error: insertError } = await supabase
    .from('fansub_groups')
    .insert({
      name: formData.name,
      description: formData.description || null,
      website_url: formData.website_url || null,
      telegram_url: formData.telegram_url || null,
      discord_url: formData.discord_url || null,
      logo_url: formData.logo_url || null,
      founded_at: formData.founded_at || null,
      status: 'approved' as const,
      is_active: true,
    })
    .select('id')
    .single()

  if (insertError) return { error: 'שגיאה ביצירת הקבוצה: ' + insertError.message }

  // Assign submitter as manager if applicable
  if (app.submitted_by && newGroup) {
    await supabase
      .from('profiles')
      .update({ role: 'manager' })
      .eq('id', app.submitted_by)
    await supabase
      .from('fansub_groups')
      .update({ manager_uid: app.submitted_by })
      .eq('id', newGroup.id)
  }

  await supabase
    .from('fansub_applications')
    .update({
      status: 'approved' as const,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq('id', parsed.data)

  revalidatePath('/admin/applications')
  revalidatePath('/fansubs')
  return { error: null }
}

export async function rejectApplication(applicationId: string, note: string) {
  const parsedId = uuidSchema.safeParse(applicationId)
  const parsedNote = z.string().max(2000).safeParse(note)
  if (!parsedId.success) return { error: 'מזהה לא תקין' }
  if (!parsedNote.success) return { error: 'הערה לא תקינה' }

  const { supabase, userId } = await requireAdmin()

  await supabase
    .from('fansub_applications')
    .update({
      status: 'rejected' as const,
      admin_notes: parsedNote.data,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq('id', parsedId.data)

  revalidatePath('/admin/applications')
  return { error: null }
}

export async function resolveSearch(queryString: string) {
  const parsed = z.string().min(1).max(500).safeParse(queryString)
  if (!parsed.success) return { error: 'שאילתה לא תקינה' }

  const { supabase } = await requireAdmin()
  await supabase
    .from('search_analytics')
    .update({ resolved: true })
    .eq('query_string', parsed.data)

  revalidatePath('/admin/analytics')
  return { error: null }
}

export async function mergeSearches(primary: string, duplicates: string[]) {
  const parsedPrimary = z.string().min(1).max(500).safeParse(primary)
  const parsedDuplicates = z.array(z.string().min(1).max(500)).min(1).safeParse(duplicates)
  if (!parsedPrimary.success || !parsedDuplicates.success) {
    return { error: 'נתונים לא תקינים' }
  }

  const { supabase } = await requireAdmin()

  const { data: dupes } = await supabase
    .from('search_analytics')
    .select('search_count')
    .in('query_string', parsedDuplicates.data)

  const extraCount = dupes?.reduce((sum, d) => sum + d.search_count, 0) ?? 0

  const { data: primaryRow } = await supabase
    .from('search_analytics')
    .select('search_count')
    .eq('query_string', parsedPrimary.data)
    .single()

  if (primaryRow) {
    await supabase
      .from('search_analytics')
      .update({ search_count: primaryRow.search_count + extraCount })
      .eq('query_string', parsedPrimary.data)
  }

  await supabase
    .from('search_analytics')
    .delete()
    .in('query_string', parsedDuplicates.data)

  revalidatePath('/admin/analytics')
  return { error: null }
}

// Form builder actions
export async function createFormField(data: {
  form_name: string
  field_key: string
  field_label_he: string
  field_label_en: string
  field_type: string
  is_required: boolean
  placeholder_he?: string
}) {
  const schema = z.object({
    form_name: z.string().min(1).max(100),
    field_key: z.string().min(1).max(100),
    field_label_he: z.string().min(1).max(255),
    field_label_en: z.string().min(1).max(255),
    field_type: z.enum(['text', 'textarea', 'url', 'date', 'image', 'select', 'email']),
    is_required: z.boolean(),
    placeholder_he: z.string().max(255).optional(),
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const { supabase } = await requireAdmin()

  // Get max sort_order
  const { data: existing } = await supabase
    .from('form_fields')
    .select('sort_order')
    .eq('form_name', parsed.data.form_name)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

  const { error } = await supabase
    .from('form_fields')
    .insert({ ...parsed.data, sort_order: nextOrder })

  if (error) return { error: error.message }

  revalidatePath('/admin/form-builder')
  return { error: null }
}

export async function updateFormField(
  id: string,
  data: {
    field_label_he: string
    field_label_en: string
    field_type: string
    is_required: boolean
    placeholder_he?: string
  }
) {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) return { error: 'מזהה לא תקין' }

  const schema = z.object({
    field_label_he: z.string().min(1).max(255),
    field_label_en: z.string().min(1).max(255),
    field_type: z.enum(['text', 'textarea', 'url', 'date', 'image', 'select', 'email']),
    is_required: z.boolean(),
    placeholder_he: z.string().max(255).optional(),
  })

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('form_fields')
    .update(parsed.data)
    .eq('id', parsedId.data)

  if (error) return { error: error.message }

  revalidatePath('/admin/form-builder')
  return { error: null }
}

export async function toggleFormField(id: string, currentValue: boolean) {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) return { error: 'מזהה לא תקין' }

  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('form_fields')
    .update({ is_active: !currentValue })
    .eq('id', parsedId.data)

  if (error) return { error: error.message }

  revalidatePath('/admin/form-builder')
  return { error: null }
}

export async function reorderFormFields(orderedIds: string[]) {
  const parsed = z.array(z.string().uuid()).safeParse(orderedIds)
  if (!parsed.success) return { error: 'נתונים לא תקינים' }

  const { supabase } = await requireAdmin()

  for (let i = 0; i < parsed.data.length; i++) {
    await supabase
      .from('form_fields')
      .update({ sort_order: i + 1 })
      .eq('id', parsed.data[i])
  }

  revalidatePath('/admin/form-builder')
  return { error: null }
}
