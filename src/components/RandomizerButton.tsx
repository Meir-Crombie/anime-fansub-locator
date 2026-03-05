'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shuffle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RandomizerButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleRandomize() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/randomize')
      const json = await res.json()

      if (res.ok && json.data?.id) {
        router.push(`/anime/${json.data.id}`)
      }
    } catch {
      // Silently fail — the button just won't navigate
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleRandomize}
      disabled={isLoading}
      variant="outline"
      size="lg"
      className="gap-2 rounded-full border-primary/30 hover:bg-primary/10"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Shuffle className="h-5 w-5" aria-hidden />
      )}
      <span>אנימה אקראית</span>
    </Button>
  )
}
