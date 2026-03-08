'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ModerationRow {
  id: string
  reported_item_id: string
  item_type: string
  reason: string
  requested_by: string
  status: string
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

// Untyped Supabase client for tables not yet in generated types
function createUntypedServerClient() {
  const supabase = createServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

const createModerationSchema = z.object({
  reported_item_id: z.string().uuid(),
  item_type: z.enum(['review', 'comment', 'translation']),
  reason: z.string().min(5, 'יש לציין סיבה').max(1000),
})

export async function createModerationRequest(data: Record<string, unknown>) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = createModerationSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const untypedClient = createUntypedServerClient()
  const { error } = await untypedClient.from('moderation_requests').insert({
    reported_item_id: parsed.data.reported_item_id,
    item_type: parsed.data.item_type,
    reason: parsed.data.reason,
    requested_by: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  return { error: null }
}

export async function resolveModerationRequest(
  id: string,
  action: 'approve' | 'reject'
) {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { error: 'מזהה לא תקין' }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }

  // Get the moderation request
  const untypedClient = createUntypedServerClient()
  const { data: rawRequest } = await untypedClient
    .from('moderation_requests')
    .select('*')
    .eq('id', parsed.data)
    .single()
  if (!rawRequest) return { error: 'בקשה לא נמצאה' }

  const request = rawRequest as ModerationRow

  if (action === 'approve') {
    // Delete the reported item based on type
    if (request.item_type === 'review') {
      await supabase.from('ratings').delete().eq('id', request.reported_item_id)
    } else if (request.item_type === 'translation') {
      await supabase.from('translations').delete().eq('id', request.reported_item_id)
    }

    await untypedClient
      .from('moderation_requests')
      .update({
        status: 'approved_deleted',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', parsed.data)
  } else {
    await untypedClient
      .from('moderation_requests')
      .update({
        status: 'rejected',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', parsed.data)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/moderation')
  return { error: null }
}
