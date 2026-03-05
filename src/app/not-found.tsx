import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" aria-hidden />
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6">
        הדף שחיפשת לא נמצא
      </p>
      <Button asChild>
        <Link href="/">חזרה לדף הבית</Link>
      </Button>
    </main>
  )
}
