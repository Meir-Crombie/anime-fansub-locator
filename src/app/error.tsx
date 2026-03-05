'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error-boundary]', error)
  }, [error])

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" aria-hidden />
      <h1 className="text-2xl font-bold mb-2">משהו השתבש</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        אירעה שגיאה בלתי צפויה. נסה לטעון מחדש את הדף.
      </p>
      <Button onClick={reset} variant="outline">
        נסה שוב
      </Button>
    </main>
  )
}
