import { z } from 'zod'

const currentYear = new Date().getFullYear()

const optionalUrl = z
  .string()
  .max(512, { message: 'הכתובת ארוכה מדי (מקסימום 512 תווים)' })
  .refine(
    (val) => val === '' || /^https?:\/\/.+/.test(val),
    { message: 'כתובת URL אינה תקינה (חייבת להתחיל ב-https://)' }
  )
  .optional()
  .or(z.literal(''))

export const ACTIVITY_STATUS_OPTIONS = [
  { value: 'active',    label: 'פעיל' },
  { value: 'on_break',  label: 'בהפסקה זמנית' },
  { value: 'inactive',  label: 'לא פעיל' },
] as const

export const TRANSLATION_DOMAIN_OPTIONS = [
  { value: 'seasonal', label: 'עונתי (Seasonal)' },
  { value: 'movies',   label: 'סרטים' },
  { value: 'classics', label: 'קלאסיקות' },
  { value: 'manga',    label: 'מנגה' },
] as const

export const RECRUITING_ROLE_OPTIONS = [
  { value: 'translator', label: 'מתרגם/ת' },
  { value: 'editor',     label: 'עורך/ת לשוני' },
  { value: 'encoder',    label: 'מקודד/ת (Encoder)' },
  { value: 'typesetter', label: 'מעצב/ת כתוביות (Typesetter)' },
  { value: 'timer',      label: 'Timing' },
  { value: 'karaoke',    label: 'קריוקי' },
  { value: 'qc',         label: 'QA / QC' },
] as const

export const fansubProfileSchema = z
  .object({
    // Section 1 — General
    name: z
      .string()
      .min(2, { message: 'שם הקבוצה חייב להכיל לפחות 2 תווים' })
      .max(255, { message: 'שם הקבוצה ארוך מדי' }),

    logo_url: optionalUrl,

    established_year: z
      .union([
        z
          .number({ error: 'שנת הקמה חייבת להיות מספר' })
          .int()
          .min(1990, { message: 'שנת הקמה מינימלית היא 1990' })
          .max(currentYear, { message: `שנת הקמה מקסימלית היא ${currentYear}` }),
        z.literal('').transform(() => undefined),
        z.undefined(),
      ])
      .optional(),

    description: z
      .string()
      .min(10, { message: 'התיאור חייב להכיל לפחות 10 תווים' }),

    website_url:  optionalUrl,
    discord_url:  optionalUrl,
    telegram_url: optionalUrl,

    // Section 2 — Activity
    activity_status: z
      .enum(['active', 'on_break', 'inactive'])
      .refine((v) => v !== undefined, { message: 'יש לבחור סטטוס פעילות' }),

    translation_domains: z
      .array(z.string())
      .min(1, { message: 'יש לבחור לפחות תחום תרגום אחד' }),

    flagship_projects: z
      .string()
      .max(2000, { message: 'הפרויקטים ארוכים מדי (מקסימום 2000 תווים)' })
      .optional()
      .or(z.literal('')),

    // Section 3 — Recruiting
    is_recruiting: z.boolean(),

    recruiting_roles: z.array(z.string()).optional(),

    recruitment_contact: z
      .string()
      .max(500, { message: 'הטקסט ארוך מדי' })
      .optional()
      .or(z.literal('')),

    // Section 4 — Internal verification
    submitter_name: z
      .string()
      .min(1, { message: 'שם/כינוי הוא שדה חובה' })
      .max(255),

    submitter_role: z
      .string()
      .min(1, { message: 'תפקיד בקבוצה הוא שדה חובה' })
      .max(255),

    submitter_contact: z
      .string()
      .min(1, { message: 'פרטי יצירת קשר הם שדה חובה' })
      .max(255),
  })
  .superRefine((data, ctx) => {
    if (data.is_recruiting) {
      if (!data.recruiting_roles || data.recruiting_roles.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'יש לבחור לפחות תפקיד דרוש אחד',
          path: ['recruiting_roles'],
        })
      }
      if (!data.recruitment_contact || data.recruitment_contact.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'יש לפרט כיצד להצטרף לקבוצה',
          path: ['recruitment_contact'],
        })
      }
    }
  })

export type FansubProfileFormValues = z.infer<typeof fansubProfileSchema>
