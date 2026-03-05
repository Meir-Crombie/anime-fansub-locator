import { Skeleton } from '@/components/ui/skeleton'

export default function AnimeDetailLoading() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        <Skeleton className="aspect-[3/4] w-full max-w-[250px] mx-auto md:mx-0 rounded-xl" />
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-6 w-1/2 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
      <div className="mt-12 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </main>
  )
}
