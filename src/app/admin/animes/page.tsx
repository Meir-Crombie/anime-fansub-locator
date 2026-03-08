import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Anime } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminAnimesPage() {
  const supabase = createServerClient()

  const { data: animes, error } = await supabase
    .from('animes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">ניהול אנימות</h1>
        <p className="text-destructive">שגיאה בטעינת הנתונים.</p>
      </main>
    )
  }

  const typedAnimes = (animes ?? []) as Anime[]

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
            <Link key={anime.id} href={`/anime/${anime.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {anime.title_he}
                    <span className="text-sm text-muted-foreground font-normal anime-title">
                      {anime.title_en}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 text-xs text-muted-foreground">
                  {anime.genres?.join(', ') || 'ללא ז׳אנרים'}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
