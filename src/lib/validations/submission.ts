import { z } from 'zod'

// ── GroupManagerForm schema ──────────────────────────────────────────
export const groupManagerFormSchema = z.object({
  anime_name: z.string().min(1, 'יש להזין שם אנימה').max(255),
  anime_name_en: z.string().max(255).optional(),
  status: z.enum(['ongoing', 'completed', 'dropped', 'paused']),
  platforms: z
    .array(z.enum(['website', 'telegram', 'discord', 'youtube']))
    .min(1, 'יש לבחור לפחות פלטפורמה אחת'),
  direct_link: z
    .string()
    .url('קישור לא תקין')
    .refine((v) => v.startsWith('https://'), 'הקישור חייב להתחיל ב-https://'),
  episode_range: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  release_date: z.string().optional(),
  quality: z.string().optional(),
})

export type GroupManagerFormValues = z.infer<typeof groupManagerFormSchema>

// ── UserSubmissionForm schemas — per step ────────────────────────────
export const userSubmissionStep0Schema = z.object({
  anime_name: z.string().min(1, 'יש להזין שם אנימה').max(255),
  anime_name_en: z.string().max(255).optional(),
})

export const userSubmissionStep1Schema = z.object({
  translator_name: z.string().min(1, 'שם המתרגם חובה').max(255),
  translation_url: z
    .string()
    .url('קישור לא תקין')
    .refine((v) => v.startsWith('https://'), 'הקישור חייב להתחיל ב-https://'),
  platform_type: z.enum(['website', 'telegram', 'discord', 'youtube', 'other']),
  status: z.enum(['ongoing', 'completed', 'unknown']),
})

export const userSubmissionStep2Schema = z.object({
  description: z.string().max(300).optional(),
  language_quality: z.enum(['excellent', 'good', 'basic']).optional(),
})

// Full schema for server-side validation
export const userSubmissionFullSchema = userSubmissionStep0Schema
  .merge(userSubmissionStep1Schema)
  .merge(userSubmissionStep2Schema)

export type UserSubmissionFormValues = z.infer<typeof userSubmissionFullSchema>
