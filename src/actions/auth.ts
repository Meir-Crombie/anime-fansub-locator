'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const registerSchema = z
  .object({
    first_name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
    email: z.string().email('כתובת אימייל לא תקינה'),
    age: z
      .number({ error: 'יש להזין גיל' })
      .min(13, 'גיל מינימלי להרשמה הוא 13')
      .max(120, 'גיל לא תקין'),
    password: z
      .string()
      .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
      .regex(/[a-zA-Z]/, 'סיסמה חייבת להכיל לפחות אות אחת')
      .regex(/[0-9]/, 'סיסמה חייבת להכיל לפחות ספרה אחת'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirm_password'],
  })

export async function registerUser(formData: FormData) {
  const raw = {
    first_name: formData.get('first_name') as string,
    email: formData.get('email') as string,
    age: Number(formData.get('age')),
    password: formData.get('password') as string,
    confirm_password: formData.get('confirm_password') as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError ?? 'נתונים לא תקינים' }
  }

  const supabase = createServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        first_name: parsed.data.first_name,
        age: parsed.data.age,
      },
      ...(siteUrl ? { emailRedirectTo: `${siteUrl}/auth/callback` } : {}),
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'כתובת האימייל הזו כבר רשומה במערכת' }
    }
    return { error: 'שגיאה בהרשמה. נסה שוב.' }
  }

  return { success: true }
}

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'נא להזין סיסמה'),
})

export async function loginUser(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError ?? 'נתונים לא תקינים' }
  }

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'אימייל או סיסמה שגויים' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'יש לאשר את האימייל שלך לפני ההתחברות. בדוק את תיבת הדואר.' }
    }
    return { error: 'שגיאה בהתחברות. נסה שוב.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'כתובת אימייל לא תקינה' }
  }

  const supabase = createServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  await supabase.auth.resetPasswordForEmail(email, {
    ...(siteUrl ? { redirectTo: `${siteUrl}/reset-password` } : {}),
  })

  // Always return success for security — don't reveal if email exists
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 8) {
    return { error: 'סיסמה חייבת להכיל לפחות 8 תווים' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { error: 'סיסמה חייבת להכיל לפחות אות אחת' }
  }
  if (!/[0-9]/.test(password)) {
    return { error: 'סיסמה חייבת להכיל לפחות ספרה אחת' }
  }
  if (password !== confirmPassword) {
    return { error: 'הסיסמאות אינן תואמות' }
  }

  const supabase = createServerClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'שגיאה בעדכון הסיסמה. נסה שוב.' }
  }

  redirect('/login?message=password_reset_success')
}
