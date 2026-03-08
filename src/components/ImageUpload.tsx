'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadCoverImage } from '@/actions/upload'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  className?: string
}

export default function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadCoverImage(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        onChange(result.url)
      }
    } catch {
      setError('שגיאה בהעלאת התמונה')
    } finally {
      setIsUploading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onChange('')
    setError(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        /* Preview */
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-border bg-muted group">
          <Image
            src={value}
            alt="תמונת כיסוי"
            fill
            sizes="400px"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors cursor-pointer"
            >
              החלף תמונה
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 rounded-lg bg-red-500/70 text-white text-xs font-medium hover:bg-red-500/90 transition-colors cursor-pointer"
            >
              הסר
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            'w-full aspect-[16/9] rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <span className="text-2xl animate-spin">⏳</span>
              <span className="text-xs text-muted-foreground">מעלה תמונה...</span>
            </>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-xs text-muted-foreground">
                לחץ או גרור תמונה לכאן
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                JPG, PNG, WebP, GIF — עד 2MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
