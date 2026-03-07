'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InactivitySettingsProps {
  initialThreshold: number
}

export default function InactivitySettings({ initialThreshold }: InactivitySettingsProps) {
  const [months, setMonths] = useState(initialThreshold)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setResult(null)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'inactivity_threshold_months', value: String(months) }),
    })
    setSaving(false)
    setResult(res.ok ? 'נשמר ✅' : 'שגיאה ❌')
  }

  async function handleRunCheck() {
    setSaving(true)
    setResult(null)
    const res = await fetch('/api/admin/check-inactive', { method: 'POST' })
    const json = await res.json()
    setSaving(false)
    setResult(res.ok ? `עודכנו ${json.count} קבוצות` : 'שגיאה ❌')
  }

  return (
    <div className="space-y-3" dir="rtl">
      <p className="text-sm text-muted-foreground">
        קבוצה שלא עדכנה פרויקט תוך X חודשים תסומן כ&quot;לא פעילה&quot; אוטומטית.
      </p>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">סף חוסר פעילות:</label>
        <Input
          type="number"
          min={1}
          max={24}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-20"
        />
        <span className="text-sm text-muted-foreground">חודשים</span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
        >
          שמור הגדרה
        </Button>
        <Button
          variant="outline"
          onClick={handleRunCheck}
          disabled={saving}
          size="sm"
        >
          הרץ בדיקה עכשיו
        </Button>
      </div>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  )
}
