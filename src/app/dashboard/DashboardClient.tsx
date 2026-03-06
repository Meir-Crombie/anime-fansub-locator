'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { updateFansubGroup } from '@/actions/fansubs'
import { deleteTranslation } from '@/actions/translations'
import { createAnnouncement, toggleAnnouncementPublished, deleteAnnouncement } from '@/actions/announcements'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TranslationBadge } from '@/components/TranslationBadge'
import EmptyState from '@/components/EmptyState'
import { Plus, Trash2, Loader2, Pencil, Megaphone, Eye, EyeOff, Settings } from 'lucide-react'
import type { FansubGroup } from '@/lib/types'

type TranslationRow = {
  id: string
  status: 'ongoing' | 'completed' | 'dropped'
  platform: 'website' | 'telegram' | 'discord' | 'youtube'
  direct_link: string
  notes: string | null
  updated_at: string
  episode_progress: { translated_episodes: number; total_episodes: number | null }[] | null
  animes: { id: string; title_he: string; title_en: string; cover_image_url: string | null } | null
}

type AnnouncementRow = {
  id: string
  title: string
  type: string
  created_at: string
  is_published: boolean
}

interface DashboardClientProps {
  fansub: FansubGroup
  translations: TranslationRow[]
  announcements: AnnouncementRow[]
}

const ANNOUNCEMENT_TYPE_LABELS: Record<string, string> = {
  episode_release: 'פרק חדש',
  new_project: 'פרויקט חדש',
  completed: 'הושלם',
  general: 'כללי',
}

export default function DashboardClient({
  fansub,
  translations: initialTranslations,
  announcements: initialAnnouncements,
}: DashboardClientProps) {
  const router = useRouter()
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)

  const [translations, setTranslations] = useState(initialTranslations)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annType, setAnnType] = useState('general')
  const [isSavingAnn, setIsSavingAnn] = useState(false)

  async function handleSaveGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSavingGroup(true)
    setGroupError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('id', fansub.id)

    try {
      const result = await updateFansubGroup(formData)
      if (result?.error) {
        setGroupError('שגיאה בשמירת הנתונים')
      } else {
        setIsEditingGroup(false)
        router.refresh()
      }
    } catch {
      setGroupError('שגיאה בשמירת הנתונים')
    }
    setIsSavingGroup(false)
  }

  async function handleDeleteTranslation(id: string) {
    if (!confirm('האם למחוק את התרגום?')) return
    setDeletingId(id)
    await deleteTranslation(id)
    setTranslations((prev) => prev.filter((t) => t.id !== id))
    setDeletingId(null)
  }

  async function handleCreateAnnouncement() {
    if (!annTitle.trim() || !annContent.trim()) return
    setIsSavingAnn(true)
    const result = await createAnnouncement({
      fansub_id: fansub.id,
      title: annTitle,
      content: annContent,
      type: annType,
      is_published: true,
    })
    if (!result.error) {
      setShowAnnouncementForm(false)
      setAnnTitle('')
      setAnnContent('')
      setAnnType('general')
      router.refresh()
    }
    setIsSavingAnn(false)
  }

  async function handleToggleAnnouncement(id: string, current: boolean) {
    await toggleAnnouncementPublished(id, fansub.id, current)
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_published: !current } : a))
    )
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm('האם למחוק את העדכון?')) return
    await deleteAnnouncement(id, fansub.id)
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <>
      {/* Section 1: Group Details */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>פרטי הקבוצה</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={'/dashboard/profile' as never}>
                  <Settings className="h-4 w-4 me-1" aria-hidden />
                  ערוך פרופיל
                </Link>
              </Button>
              {!isEditingGroup && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingGroup(true)}>
                  <Pencil className="h-4 w-4 me-1" /> קישורים
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingGroup ? (
              <form onSubmit={handleSaveGroup} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">שם</label>
                  <Input name="name" defaultValue={fansub.name} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">תיאור</label>
                  <textarea
                    name="description"
                    defaultValue={fansub.description ?? ''}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">אתר</label>
                    <Input name="website_url" type="url" dir="ltr" defaultValue={fansub.website_url ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">טלגרם</label>
                    <Input name="telegram_url" type="url" dir="ltr" defaultValue={fansub.telegram_url ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">דיסקורד</label>
                    <Input name="discord_url" type="url" dir="ltr" defaultValue={fansub.discord_url ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">לוגו (URL)</label>
                    <Input name="logo_url" type="url" dir="ltr" defaultValue={fansub.logo_url ?? ''} />
                  </div>
                </div>
                {groupError && <p className="text-sm text-destructive">{groupError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSavingGroup}>
                    {isSavingGroup && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                    שמור
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditingGroup(false)}>
                    ביטול
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p><strong>שם:</strong> {fansub.name}</p>
                {fansub.description && <p><strong>תיאור:</strong> {fansub.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  {fansub.website_url && <Badge variant="outline">אתר</Badge>}
                  {fansub.telegram_url && <Badge variant="outline">טלגרם</Badge>}
                  {fansub.discord_url && <Badge variant="outline">דיסקורד</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section 2: Translations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">תרגומים ({translations.length})</h2>
          <Button asChild>
            <Link href="/dashboard/edit">
              <Plus className="h-4 w-4 me-2" aria-hidden />
              תרגום חדש
            </Link>
          </Button>
        </div>

        {translations.length === 0 ? (
          <EmptyState message="עדיין לא הוספת תרגומים. לחץ על 'תרגום חדש' כדי להתחיל." />
        ) : (
          <div className="space-y-2">
            {translations.map((t) => {
              if (!t.animes) return null
              const progress = t.episode_progress?.[0]
              return (
                <Card key={t.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 py-3">
                    <div className="relative h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {t.animes.cover_image_url ? (
                        <Image src={t.animes.cover_image_url} alt={t.animes.title_he} fill sizes="32px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px]">🎬</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/anime/${t.animes.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                        {t.animes.title_he}
                      </Link>
                      <p className="text-xs text-muted-foreground">{t.animes.title_en}</p>
                    </div>
                    <TranslationBadge status={t.status} platform={t.platform} />
                    {progress && (
                      <span className="text-xs text-muted-foreground">
                        {progress.translated_episodes}/{progress.total_episodes ?? '?'}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTranslation(t.id)}
                      disabled={deletingId === t.id}
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Section 3: Announcements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" aria-hidden />
            עדכונים
          </h2>
          <Button size="sm" onClick={() => setShowAnnouncementForm(true)}>
            <Plus className="h-4 w-4 me-1" />
            פרסם עדכון
          </Button>
        </div>

        {showAnnouncementForm && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <Input
                placeholder="כותרת"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
              />
              <textarea
                placeholder="תוכן העדכון..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
              />
              <select
                value={annType}
                onChange={(e) => setAnnType(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="general">כללי</option>
                <option value="episode_release">פרק חדש</option>
                <option value="new_project">פרויקט חדש</option>
                <option value="completed">הושלם</option>
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateAnnouncement} disabled={isSavingAnn}>
                  {isSavingAnn && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                  פרסם
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAnnouncementForm(false)}
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {announcements.length === 0 ? (
          <EmptyState message="אין עדכונים עדיין" />
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {ANNOUNCEMENT_TYPE_LABELS[a.type] ?? a.type}
                      </Badge>
                      <span className="font-medium text-sm">{a.title}</span>
                    </div>
                  </div>
                  <Badge variant={a.is_published ? 'default' : 'outline'}>
                    {a.is_published ? 'מפורסם' : 'טיוטה'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleAnnouncement(a.id, a.is_published)}
                  >
                    {a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteAnnouncement(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
