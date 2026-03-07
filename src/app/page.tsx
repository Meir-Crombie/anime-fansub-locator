import { TrendingUp, Film, Users } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import SearchBar from '@/components/SearchBar'
import SmartRandomizer from '@/components/SmartRandomizer'
import AnimeGrid from '@/components/AnimeGrid'
import type { AnimeCardData } from '@/components/AnimeCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createServerClient()

  // Fetch counts and recent animes in parallel
  const [animesCountRes, fansubsCountRes, recentAnimesRes] = await Promise.all([
    supabase.from('animes').select('id', { count: 'exact', head: true }),
    supabase.from('fansub_groups').select('id', { count: 'exact', head: true }),
    supabase
      .from('animes')
      .select('id, title_he, title_en, cover_image_url, genres')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const animesCount = animesCountRes.count ?? 0
  const fansubsCount = fansubsCountRes.count ?? 0
  const recentAnimes = (recentAnimesRes.data ?? []) as AnimeCardData[]

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-12">
      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center space-y-8 relative">
        {/* Gradient background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        <div className="relative space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            <span>גלה אנימות בעברית</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-glow">
            כל הפאנסאבים
            <br />
            <span className="text-primary">במקום אחד</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            גלה איזה קבוצות פאנסאב ישראליות תרגמו את האנימה שאתה מחפש, מצב התרגום, ואיפה לצפות.
          </p>
        </div>

        {/* Search Bar */}
        <div className="animate-fade-in">
          <SearchBar />
        </div>

        {/* Randomizer */}
        <div className="animate-fade-in">
          <SmartRandomizer />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-center animate-fade-in">
          <div className="glass-card rounded-xl p-4">
            <Film className="h-5 w-5 text-primary mx-auto mb-1" aria-hidden />
            <div className="text-2xl font-bold text-primary">{animesCount}</div>
            <div className="text-xs text-muted-foreground mt-1">אנימות במאגר</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" aria-hidden />
            <div className="text-2xl font-bold text-primary">{fansubsCount}</div>
            <div className="text-xs text-muted-foreground mt-1">קבוצות פאנסאב</div>
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="w-full max-w-6xl mt-16 space-y-6">
        <h2 className="text-2xl font-bold text-center">נוספו לאחרונה</h2>
        <AnimeGrid animes={recentAnimes} />
      </section>
    </main>
  )
}
