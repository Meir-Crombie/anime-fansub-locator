import { Globe, Send, MessageSquare, Youtube, Check, Clock, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TRANSLATION_STATUSES, PLATFORMS } from '@/lib/constants'
import type { Translation } from '@/lib/types'

interface TranslationBadgeProps {
  status: Translation['status']
  platform: Translation['platform']
}

const platformIcons = {
  website: Globe,
  telegram: Send,
  discord: MessageSquare,
  youtube: Youtube,
} as const

const statusIcons = {
  ongoing: Clock,
  completed: Check,
  dropped: X,
} as const

const statusColors = {
  ongoing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  dropped: 'bg-red-500/10 text-red-500 border-red-500/20',
} as const

export function TranslationBadge({ status, platform }: TranslationBadgeProps) {
  const statusInfo = TRANSLATION_STATUSES.find((s) => s.value === status)
  const platformInfo = PLATFORMS.find((p) => p.value === platform)
  const StatusIcon = statusIcons[status]
  const PlatformIcon = platformIcons[platform]

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={cn('gap-1', statusColors[status])}>
        <StatusIcon className="h-3 w-3" aria-hidden />
        {statusInfo?.label ?? status}
      </Badge>
      <Badge variant="secondary" className="gap-1">
        <PlatformIcon className="h-3 w-3" aria-hidden />
        {platformInfo?.label ?? platform}
      </Badge>
    </div>
  )
}
