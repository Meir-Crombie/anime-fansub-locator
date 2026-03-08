'use server'

import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadCoverImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { url: null, error: 'לא נבחר קובץ' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: 'סוג קובץ לא נתמך. יש להעלות JPG, PNG, WebP או GIF' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: 'הקובץ גדול מדי. מקסימום 2MB' }
  }

  const supabase = createServerClient()

  // Generate a unique filename
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const filePath = `covers/${fileName}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload] Storage error:', uploadError)
    return { url: null, error: 'שגיאה בהעלאת הקובץ. נסה שוב.' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('covers')
    .getPublicUrl(filePath)

  return { url: publicUrl, error: null }
}
