'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Cropper from 'react-easy-crop'
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
  
  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // 1. When user selects a file, load it into the cropper instead of uploading immediately
  function handleFileSelect(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageSrc(reader.result?.toString() || null)
    })
    reader.readAsDataURL(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = '' // Reset input
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // 2. When user confirms the crop, crop the image and upload it
  async function handleCropAndUpload() {
    if (!imageSrc || !croppedAreaPixels) return

    setIsUploading(true)
    setError(null)
    
    try {
      // Create the cropped image file
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      
      const formData = new FormData()
      formData.append('file', croppedFile)
      
      // Upload to server
      const result = await uploadCoverImage(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        onChange(result.url)
        setImageSrc(null) // Close cropper
      }
    } catch (e) {
      setError('שגיאה בחיתוך או העלאת התמונה')
      console.error(e)
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemove() {
    onChange('')
    setError(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Cropper Modal Overlay */}
      {imageSrc && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="relative w-full h-[50vh] sm:h-[60vh] bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 border-t flex items-center justify-between bg-card">
              <div className="text-sm text-muted-foreground hidden sm:block">
                גלול כדי לעשות זום, גרור כדי למקם
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setImageSrc(null)}
                  className="px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-muted transition-colors flex-1 sm:flex-none"
                  disabled={isUploading}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={handleCropAndUpload}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-1 sm:flex-none flex justify-center items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin text-lg leading-none">⏳</span>
                      מעלה...
                    </>
                  ) : (
                    'חתוך והעלה'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
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

// --- Helper Functions for Cropping ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid CORS issues
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // As a blob to convert into a File
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      const file = new File([blob], 'cropped-cover.jpg', { type: 'image/jpeg' })
      resolve(file)
    }, 'image/jpeg')
  })
}