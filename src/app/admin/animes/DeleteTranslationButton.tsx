'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { deleteTranslation } from '@/actions/translations'
import { useRouter } from 'next/navigation'

interface DeleteTranslationButtonProps {
  translationId: string
}

export default function DeleteTranslationButton({ translationId }: DeleteTranslationButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const result = await deleteTranslation(translationId)
    if (result.error) {
      alert(result.error)
      setLoading(false)
      setConfirming(false)
    } else {
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? '...' : 'מחק'}
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
      size="icon"
      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => setConfirming(true)}
    >
      <X className="h-3 w-3" aria-hidden />
    </Button>
  )
}
