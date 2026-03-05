'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  fansubProfileSchema,
  ACTIVITY_STATUS_OPTIONS,
  TRANSLATION_DOMAIN_OPTIONS,
  RECRUITING_ROLE_OPTIONS,
  type FansubProfileFormValues,
} from '@/lib/validations/fansub'
import { upsertFansubProfile } from '@/actions/fansubs'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import type { FansubGroup } from '@/lib/types'

interface FansubProfileFormProps {
  defaultValues?: Partial<FansubGroup>
}

export default function FansubProfileForm({ defaultValues }: FansubProfileFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FansubProfileFormValues>({
    resolver: zodResolver(fansubProfileSchema),
    defaultValues: {
      name:                 defaultValues?.name ?? '',
      logo_url:             defaultValues?.logo_url ?? '',
      established_year:     undefined,
      description:          defaultValues?.description ?? '',
      website_url:          defaultValues?.website_url ?? '',
      discord_url:          defaultValues?.discord_url ?? '',
      telegram_url:         defaultValues?.telegram_url ?? '',
      activity_status:      'active',
      translation_domains:  [],
      flagship_projects:    '',
      is_recruiting:        defaultValues?.is_recruiting ?? false,
      recruiting_roles:     [],
      recruitment_contact:  '',
      submitter_name:       '',
      submitter_role:       '',
      submitter_contact:    '',
    },
  })

  const isRecruiting = form.watch('is_recruiting')
  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: FansubProfileFormValues) {
    setServerError(null)
    const result = await upsertFansubProfile(values as Record<string, unknown>)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>

        {/* ─── Section 1: General Details ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פרטים כלליים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הקבוצה *</FormLabel>
                  <FormControl>
                    <Input placeholder="שם קבוצת הפאנסאב" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>לוגו (כתובת URL)</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="established_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שנת הקמה</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`1990 – ${new Date().getFullYear()}`}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אודות הקבוצה *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ספר לנו על הקבוצה שלך..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <p className="text-sm text-muted-foreground font-medium">קישורים (אופציונלי)</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אתר</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discord_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>דיסקורד</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="https://discord.gg/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telegram_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>טלגרם</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="https://t.me/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 2: Activity & Projects ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">אופי הפעילות ופרויקטים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <FormField
              control={form.control}
              name="activity_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סטטוס פעילות *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סטטוס..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="translation_domains"
              render={() => (
                <FormItem>
                  <FormLabel>תחומי תרגום *</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                    {TRANSLATION_DOMAIN_OPTIONS.map((opt) => (
                      <FormField
                        key={opt.value}
                        control={form.control}
                        name="translation_domains"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(opt.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? []
                                  field.onChange(
                                    checked
                                      ? [...current, opt.value]
                                      : current.filter((v) => v !== opt.value)
                                  )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {opt.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flagship_projects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>פרויקטים בולטים (3–5 המלצות)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="למשל: Attack on Titan, Demon Slayer, ..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── Section 3: Recruitment ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">דרושים וגיוס</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <FormField
              control={form.control}
              name="is_recruiting"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">הקבוצה מגייסת כרגע?</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      הפעל אם אתם מחפשים חברים חדשים לקבוצה
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecruiting && (
              <>
                <FormField
                  control={form.control}
                  name="recruiting_roles"
                  render={() => (
                    <FormItem>
                      <FormLabel>תפקידים דרושים *</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                        {RECRUITING_ROLE_OPTIONS.map((opt) => (
                          <FormField
                            key={opt.value}
                            control={form.control}
                            name="recruiting_roles"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(opt.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value ?? []
                                      field.onChange(
                                        checked
                                          ? [...current, opt.value]
                                          : current.filter((v) => v !== opt.value)
                                      )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {opt.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recruitment_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>איך מצטרפים? *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='למשל: "פתחו טיקט בדיסקורד שלנו"'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── Section 4: Internal Verification ───────────────────────── */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">פרטי אימות מולנו</CardTitle>
            <p className="text-sm text-muted-foreground">
              מידע זה פנימי ולא יוצג באתר. משמש לאימות זהות מגיש הבקשה.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            <FormField
              control={form.control}
              name="submitter_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם / כינוי *</FormLabel>
                  <FormControl>
                    <Input placeholder="השם שלך בקבוצה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitter_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תפקיד בקבוצה *</FormLabel>
                  <FormControl>
                    <Input placeholder='למשל: "מנהל", "מתרגם ראשי"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitter_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>פרטי יצירת קשר (אימייל / Discord Tag) *</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      placeholder="user@example.com  /  username#0000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── Errors & Submit ─────────────────────────────────────────── */}
        {serverError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
            {serverError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none sm:min-w-[160px]">
            {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isSubmitting ? 'שולח...' : 'שמור ושלח לאישור'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
        </div>

      </form>
    </Form>
  )
}
