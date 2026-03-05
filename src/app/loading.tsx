import AnimeGridSkeleton from '@/components/Skeleton/AnimeGridSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-12">
      <section className="w-full max-w-4xl text-center space-y-8">
        <Skeleton className="h-8 w-48 mx-auto rounded-full" />
        <Skeleton className="h-12 w-80 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-14 w-full max-w-2xl mx-auto rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </section>
      <section className="w-full max-w-6xl mt-16 space-y-6">
        <Skeleton className="h-8 w-40 mx-auto" />
        <AnimeGridSkeleton />
      </section>
    </main>
  )
}
