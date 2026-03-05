import { PackageOpen } from 'lucide-react'

interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground mb-4">
        {icon ?? <PackageOpen className="h-12 w-12 mx-auto" aria-hidden />}
      </div>
      <p className="text-muted-foreground text-lg">{message}</p>
    </div>
  )
}
