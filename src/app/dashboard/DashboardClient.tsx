'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { updateFansubGroup, deleteFansubGroup } from '@/actions/fansubs'
import { deleteTranslation, updateTranslation, updateEpisodeProgress } from '@/actions/translations'
import { createAnnouncement, toggleAnnouncementPublished, deleteAnnouncement } from '@/actions/announcements'
import { updateAnimeDetails } from '@/actions/animes'
import { GENRES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TranslationBadge } from '@/components/TranslationBadge'
import EmptyState from '@/components/EmptyState'
import { Plus, Trash2, Loader2, Pencil, Megaphone, Eye, EyeOff, Settings, Star, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { FansubGroup } from '@/lib/types'

type TranslationRow = {
  id: string
  status: 'ongoing' | 'completed' | 'dropped'
  platform: 'website' | 'telegram' | 'discord' | 'youtube'
  direct_link: string
  notes: string | null
  updated_at: string
  episode_progress: { translated_episodes: number; total_episodes: number | null }[] | null
  animes: { id: string; title_he: string; title_en: string; cover_image_url: string | null; genres: string[]; synopsis: string | null } | null
}

type AnnouncementRow = {
  id: string
  title: string
  type: string
  created_at: string
  is_published: boolean
}

type RatingRow = {
  score: number
  review: string | null
  created_at: string
}

type GroupData = {
  fansub: FansubGroup
  translations: TranslationRow[]
  announcements: AnnouncementRow[]
  ratings: RatingRow[]
  ratingCount: number
  avgRating: string | null
}

interface DashboardClientProps {
  allGroups: { id: string; name: string }[]
  groupDataMap: Record<string, GroupData>
  defaultGroupId: string
}

const ANNOUNCEMENT_TYPE_LABELS: Record<string, string> = {
  episode_release: 'פרק חדש',
  new_project: 'פרויקט חדש',
  completed: 'הושלם',
  general: 'כללי',
}

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'בתרגום',
  completed: 'הושלם',
  dropped: 'ננטש',
}

const PLATFORM_LABELS: Record<string, string> = {
  website: 'אתר',
  telegram: 'טלגרם',
  discord: 'דיסקורד',
  youtube: 'יוטיוב',
}

const QUALITY_OPTIONS = [
  { value: 'bluray', label: 'Blu-ray' },
  { value: 'web', label: 'WEB' },
  { value: 'tv', label: 'TV' },
  { value: 'dvd', label: 'DVD' },
]

export default function DashboardClient({
  allGroups,
  groupDataMap,
  defaultGroupId,
}: DashboardClientProps) {
  const router = useRouter()
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId)
  const currentData = groupDataMap[selectedGroupId]

  const fansub = currentData.fansub
  const [translationsMap, setTranslationsMap] = useState<Record<string, TranslationRow[]>>(
    Object.fromEntries(Object.entries(groupDataMap).map(([id, d]) => [id, d.translations]))
  )
  const [announcementsMap, setAnnouncementsMap] = useState<Record<string, AnnouncementRow[]>>(
    Object.fromEntries(Object.entries(groupDataMap).map(([id, d]) => [id, d.announcements]))
  )

  const translations = translationsMap[selectedGroupId] ?? []
  const announcements = announcementsMap[selectedGroupId] ?? []

  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

  // Inline translation edit state
  const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    status: '', platform: '', direct_link: '', notes: '',
    translated_episodes: 0, total_episodes: '',
    cover_image_url: '', genres: [] as string[], synopsis: '',
    credits: '', episode_range: '', quality: '',
  })
  const [isSavingTranslation, setIsSavingTranslation] = useState(false)

  // Announcements form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annType, setAnnType] = useState('general')
  const [isSavingAnn, setIsSavingAnn] = useState(false)

  // Stats
  const completedCount = useMemo(() => translations.filter((t) => t.status === 'completed').length, [translations])
  const ongoingCount = useMemo(() => translations.filter((t) => t.status === 'ongoing').length, [translations])

  function handleGroupSwitch(groupId: string) {
    setSelectedGroupId(groupId)
    setIsEditingGroup(false)
    setEditingTranslationId(null)
    setShowAnnouncementForm(false)
  }

  function startEditTranslation(t: TranslationRow) {
    const progress = t.episode_progress?.[0]
    // Parse structured fields from notes
    const notes = t.notes ?? ''
    const parts = notes.split(' | ')
    let credits = ''
    let episodeRange = ''
    let quality = ''
    const otherParts: string[] = []
    for (const part of parts) {
      if (part.startsWith('קרדיטים: ')) credits = part.replace('קרדיטים: ', '')
      else if (part.startsWith('פרקים: ')) episodeRange = part.replace('פרקים: ', '')
      else if (part.startsWith('איכות: ')) quality = part.replace('איכות: ', '')
      else if (!part.startsWith('תאריך: ')) otherParts.push(part)
    }
    setEditingTranslationId(t.id)
    setEditForm({
      status: t.status,
      platform: t.platform,
      direct_link: t.direct_link,
      notes: otherParts.join(' | '),
      translated_episodes: progress?.translated_episodes ?? 0,
      total_episodes: progress?.total_episodes?.toString() ?? '',
      cover_image_url: t.animes?.cover_image_url ?? '',
      genres: t.animes?.genres ?? [],
      synopsis: t.animes?.synopsis ?? '',
      credits,
      episode_range: episodeRange,
      quality,
    })
  }

  async function handleSaveTranslation() {
    if (!editingTranslationId) return
    setIsSavingTranslation(true)
    const currentTranslation = translations.find((t) => t.id === editingTranslationId)

    // Build combined notes from structured fields
    const notesParts: string[] = []
    if (editForm.episode_range) notesParts.push(`פרקים: ${editForm.episode_range}`)
    if (editForm.quality) notesParts.push(`איכות: ${editForm.quality}`)
    if (editForm.credits) notesParts.push(`קרדיטים: ${editForm.credits}`)
    if (editForm.notes) notesParts.push(editForm.notes)
    const combinedNotes = notesParts.length > 0 ? notesParts.join(' | ') : null

    const result = await updateTranslation({
      id: editingTranslationId,
      status: editForm.status,
      platform: editForm.platform,
      direct_link: editForm.direct_link,
      notes: combinedNotes,
    })
    // Also update episode progress
    const totalEp = editForm.total_episodes ? parseInt(editForm.total_episodes, 10) : null
    await updateEpisodeProgress({
      translation_id: editingTranslationId,
      translated_episodes: editForm.translated_episodes,
      total_episodes: (totalEp !== null && !isNaN(totalEp)) ? totalEp : null,
    })
    // Update anime details (cover image + genres) if changed
    if (currentTranslation?.animes) {
      const coverChanged = editForm.cover_image_url !== (currentTranslation.animes.cover_image_url ?? '')
      const genresChanged = JSON.stringify(editForm.genres) !== JSON.stringify(currentTranslation.animes.genres ?? [])
      const synopsisChanged = editForm.synopsis !== (currentTranslation.animes.synopsis ?? '')
      if (coverChanged || genresChanged || synopsisChanged) {
        await updateAnimeDetails({
          anime_id: currentTranslation.animes.id,
          cover_image_url: editForm.cover_image_url,
          genres: editForm.genres,
          synopsis: editForm.synopsis,
        })
      }
    }
    if (!result.error) {
      setTranslationsMap((prev) => ({
        ...prev,
        [selectedGroupId]: prev[selectedGroupId].map((t) =>
          t.id === editingTranslationId
            ? {
                ...t,
                status: editForm.status as TranslationRow['status'],
                platform: editForm.platform as TranslationRow['platform'],
                direct_link: editForm.direct_link,
                notes: combinedNotes,
                episode_progress: [{
                  translated_episodes: editForm.translated_episodes,
                  total_episodes: (totalEp !== null && !isNaN(totalEp)) ? totalEp : null,
                }],
                animes: t.animes ? { ...t.animes, cover_image_url: editForm.cover_image_url || null, genres: editForm.genres, synopsis: editForm.synopsis || null } : null,
              }
            : t
        ),
      }))
      setEditingTranslationId(null)
    }
    setIsSavingTranslation(false)
  }

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
    setTranslationsMap((prev) => ({
      ...prev,
      [selectedGroupId]: prev[selectedGroupId].filter((t) => t.id !== id),
    }))
    setDeletingId(null)
  }

  async function handleDeleteGroup() {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הקבוצה "${fansub.name}"? פעולה זו בלתי הפיכה ותמחק גם את כל התרגומים וההודעות.`)) return
    setIsDeletingGroup(true)
    const result = await deleteFansubGroup(fansub.id)
    if (result.error) {
      alert(result.error)
      setIsDeletingGroup(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
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
    setAnnouncementsMap((prev) => ({
      ...prev,
      [selectedGroupId]: prev[selectedGroupId].map((a) =>
        a.id === id ? { ...a, is_published: !current } : a
      ),
    }))
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm('האם למחוק את העדכון?')) return
    await deleteAnnouncement(id, fansub.id)
    setAnnouncementsMap((prev) => ({
      ...prev,
      [selectedGroupId]: prev[selectedGroupId].filter((a) => a.id !== id),
    }))
  }

  return (
    <>
      {/* Header + Group Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        {allGroups.length > 1 ? (
          <Select value={selectedGroupId} onValueChange={handleGroupSwitch}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="בחר קבוצה" />
            </SelectTrigger>
            <SelectContent>
              {allGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-muted-foreground">{fansub.name}</p>
        )}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{translations.length}</p>
            <p className="text-xs text-muted-foreground">סה&ldquo;כ תרגומים</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground">הושלמו</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{ongoingCount}</p>
            <p className="text-xs text-muted-foreground">בתרגום</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" aria-hidden />
              <span className="text-2xl font-bold">{currentData.avgRating ?? '-'}</span>
            </div>
            <p className="text-xs text-muted-foreground">{currentData.ratingCount} דירוגים</p>
          </CardContent>
        </Card>
      </section>

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
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteGroup}
                disabled={isDeletingGroup}
              >
                {isDeletingGroup ? (
                  <Loader2 className="h-4 w-4 me-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 me-1" />
                )}
                מחק קבוצה
              </Button>
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
              const isEditing = editingTranslationId === t.id
              return (
                <Card key={t.id}>
                  <CardContent className="py-3">
                    <div className="flex flex-wrap items-center gap-3">
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
                        onClick={() => isEditing ? setEditingTranslationId(null) : startEditTranslation(t)}
                        title={isEditing ? 'סגור עריכה' : 'ערוך תרגום'}
                      >
                        {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </Button>
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
                    </div>
                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Synopsis */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">תיאור</label>
                          <textarea
                            value={editForm.synopsis}
                            onChange={(e) => setEditForm((p) => ({ ...p, synopsis: e.target.value }))}
                            placeholder="תיאור קצר של האנימה..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                          />
                        </div>
                        {/* Cover image */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">תמונת כיסוי (URL)</label>
                          <Input
                            type="url"
                            dir="ltr"
                            placeholder="https://example.com/cover.jpg"
                            value={editForm.cover_image_url}
                            onChange={(e) => setEditForm((p) => ({ ...p, cover_image_url: e.target.value }))}
                          />
                        </div>
                        {/* Genres */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">ז&apos;אנרים</label>
                          <div className="flex flex-wrap gap-1.5">
                            {GENRES.map((genre) => {
                              const selected = editForm.genres.includes(genre.value)
                              return (
                                <button
                                  key={genre.value}
                                  type="button"
                                  onClick={() => setEditForm((p) => ({
                                    ...p,
                                    genres: selected
                                      ? p.genres.filter((g) => g !== genre.value)
                                      : [...p.genres, genre.value],
                                  }))}
                                  className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                                    selected
                                      ? 'border-primary bg-primary/15 text-primary'
                                      : 'border-border text-muted-foreground hover:border-primary/50'
                                  }`}
                                >
                                  {genre.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        {/* Status + Platform */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">סטטוס</label>
                            <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">פלטפורמה</label>
                            <Select value={editForm.platform} onValueChange={(v) => setEditForm((p) => ({ ...p, platform: v }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PLATFORM_LABELS).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {/* Direct link */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">קישור ישיר</label>
                          <Input
                            type="url"
                            dir="ltr"
                            value={editForm.direct_link}
                            onChange={(e) => setEditForm((p) => ({ ...p, direct_link: e.target.value }))}
                          />
                        </div>
                        {/* Episodes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">פרקים מתורגמים</label>
                            <Input
                              type="number"
                              min={0}
                              value={editForm.translated_episodes}
                              onChange={(e) => setEditForm((p) => ({ ...p, translated_episodes: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">סה&quot;כ פרקים</label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="לא ידוע"
                              value={editForm.total_episodes}
                              onChange={(e) => setEditForm((p) => ({ ...p, total_episodes: e.target.value }))}
                            />
                          </div>
                        </div>
                        {/* Episode range */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">טווח פרקים</label>
                          <Input
                            dir="ltr"
                            placeholder="לדוגמה: 1-12"
                            value={editForm.episode_range}
                            onChange={(e) => setEditForm((p) => ({ ...p, episode_range: e.target.value }))}
                          />
                        </div>
                        {/* Quality + Credits */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">איכות</label>
                            <Select value={editForm.quality || '_none'} onValueChange={(v) => setEditForm((p) => ({ ...p, quality: v === '_none' ? '' : v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר איכות..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">לא צוין</SelectItem>
                                {QUALITY_OPTIONS.map((q) => (
                                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">קרדיטים</label>
                            <Input
                              placeholder="תרגום: פלוני, עריכה: אלמוני"
                              value={editForm.credits}
                              onChange={(e) => setEditForm((p) => ({ ...p, credits: e.target.value }))}
                            />
                          </div>
                        </div>
                        {/* Notes */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">הערות</label>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[40px] resize-y"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveTranslation} disabled={isSavingTranslation}>
                            {isSavingTranslation ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Check className="h-4 w-4 me-1" />}
                            שמור
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTranslationId(null)}>
                            ביטול
                          </Button>
                        </div>
                      </div>
                    )}
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

      {/* Section 4: Latest Reviews */}
      {currentData.ratings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">ביקורות אחרונות</h2>
          <div className="space-y-2">
            {currentData.ratings.map((r, i) => (
              <Card key={i}>
                <CardContent className="py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= r.score
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                  {r.review && <p className="text-sm">{r.review}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
