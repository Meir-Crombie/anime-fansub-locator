import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DeleteAnimeButton from './DeleteAnimeButton'
import DeleteTranslationButton from './DeleteTranslationButton'

export const dynamic = 'force-dynamic'

interface TranslationRow {
  id: string
  status: string
  platform: string
  direct_link: string
  fansub_groups: { name: string } | null
}

interface AnimeRow {
  id: string
  title_he: string
  title_en: string
  genres: string[] | null
  translations: TranslationRow[]
}

export default async function AdminAnimesPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  const { data: animes, error } = await supabase
    .from('animes')
    .select('id, title_he, title_en, genres, translations(id, status, platform, direct_link, fansub_groups(name))')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">ניהול אנימות</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  const typedAnimes = (animes ?? []) as AnimeRow[]

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">ניהול אנימות ({typedAnimes.length})</h1>
        <Button asChild>
          <Link href="/dashboard/edit">
            <Plus className="h-4 w-4 me-2" aria-hidden />
            תרגום חדש
          </Link>
        </Button>
      </div>

      {typedAnimes.length === 0 ? (
        <EmptyState message="אין אנימות במאגר עדיין." />
      ) : (
        <div className="space-y-3">
          {typedAnimes.map((anime) => (
            <Card key={anime.id} className="overflow-hidden">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link href={`/anime/${anime.id}`} className="hover:text-primary transition-colors">
                    {anime.title_he}
                    <span className="text-sm text-muted-foreground font-normal anime-title ms-2">
                      {anime.title_en}
                    </span>
                  </Link>
                  {isSuperAdmin && (
                    <div className="ms-auto">
                      <DeleteAnimeButton animeId={anime.id} animeName={anime.title_he} />
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-2">
                <div className="text-xs text-muted-foreground">
                  {anime.genres?.join(', ') || 'ללא ז׳אנרים'}
                </div>
                {anime.translations.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      תרגומים ({anime.translations.length}):
                    </p>
                    {anime.translations.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {t.platform}
                        </Badge>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                          {t.status}
                        </Badge>
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {t.fansub_groups?.name ?? 'לא ידוע'}
                        </span>
                        {isSuperAdmin && (
                          <DeleteTranslationButton translationId={t.id} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
