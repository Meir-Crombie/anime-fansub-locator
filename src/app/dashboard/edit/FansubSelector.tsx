'use client'

import { useState } from 'react'
import GroupManagerForm from '@/components/forms/GroupManagerForm'

interface FansubSelectorProps {
  fansubs: { id: string; name: string }[]
}

export default function FansubSelector({ fansubs }: FansubSelectorProps) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)

  if (selected) {
    return <GroupManagerForm fansubId={selected.id} fansubName={selected.name} />
  }

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פרסום תרגום חדש</h1>
          <p className="text-sm text-muted-foreground mt-1">
            בחר את קבוצת הפאנסאב שעבורה תרצה לפרסם תרגום
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-2">
          {fansubs.map((fg) => (
            <button
              key={fg.id}
              type="button"
              onClick={() => setSelected(fg)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent/50 transition-all duration-200 text-right"
            >
              <span className="font-medium text-sm text-foreground">{fg.name}</span>
              <span className="text-xs text-muted-foreground">בחר →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
