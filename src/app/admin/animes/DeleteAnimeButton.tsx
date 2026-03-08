'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteAnime } from '@/actions/animes'
import { useRouter } from 'next/navigation'

interface DeleteAnimeButtonProps {
  animeId: string
  animeName: string
}

export default function DeleteAnimeButton({ animeId, animeName }: DeleteAnimeButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const result = await deleteAnime(animeId)
    if (result.error) {
      alert(typeof result.error === 'string' ? result.error : 'שגיאה במחיקה')
      setLoading(false)
      setConfirming(false)
    } else {
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">למחוק את {animeName}?</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'מוחק...' : 'אישור'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          ביטול
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </Button>
  )
}
