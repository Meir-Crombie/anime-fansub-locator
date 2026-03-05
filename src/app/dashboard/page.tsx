import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TranslationBadge } from '@/components/TranslationBadge'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Translation, Anime } from '@/lib/types'

interface TranslationWithAnime extends Translation {
  animes: Pick<Anime, 'id' | 'title_he' | 'title_en'>
}

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get fansub group managed by this user
  const { data: fansub } = await supabase
    .from('fansub_groups')
    .select('*')
    .eq('manager_uid', user!.id)
    .single()

  if (!fansub) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">לוח בקרה</h1>
        <EmptyState message="לא נמצאה קבוצת פאנסאב המשויכת לחשבונך. פנה למנהל המערכת." />
      </main>
    )
  }

  // Get translations for this fansub
  const { data: translations } = await supabase
    .from('translations')
    .select('*, animes(id, title_he, title_en)')
    .eq('fansub_id', fansub.id)
    .order('updated_at', { ascending: false })

  const typedTranslations = (translations ?? []) as TranslationWithAnime[]

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">לוח בקרה</h1>
          <p className="text-muted-foreground">{fansub.name}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/edit">
            <Plus className="h-4 w-4 me-2" aria-hidden />
            תרגום חדש
          </Link>
        </Button>
      </div>

      {/* Group Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>פרטי הקבוצה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>שם:</strong> {fansub.name}</p>
          {fansub.description && <p><strong>תיאור:</strong> {fansub.description}</p>}
          <div className="flex gap-2 flex-wrap">
            {fansub.website_url && <Badge variant="outline">אתר</Badge>}
            {fansub.telegram_url && <Badge variant="outline">טלגרם</Badge>}
            {fansub.discord_url && <Badge variant="outline">דיסקורד</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Translations List */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          תרגומים ({typedTranslations.length})
        </h2>
        {typedTranslations.length === 0 ? (
          <EmptyState message="עדיין לא הוספת תרגומים. לחץ על 'תרגום חדש' כדי להתחיל." />
        ) : (
          <div className="space-y-3">
            {typedTranslations.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-wrap items-center gap-3 py-4">
                  <Link
                    href={`/anime/${t.animes.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {t.animes.title_he}
                  </Link>
                  <span className="text-xs text-muted-foreground anime-title">
                    {t.animes.title_en}
                  </span>
                  <div className="flex gap-2 ms-auto">
                    <TranslationBadge status={t.status} platform={t.platform} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
