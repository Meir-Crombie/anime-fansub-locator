'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resolveSearch, mergeSearches } from '@/actions/admin'
import { Check, Merge, Download, Loader2, Search } from 'lucide-react'
import type { SearchAnalytic } from '@/lib/types'

interface AnalyticsClientProps {
  analytics: SearchAnalytic[]
}

type FilterMode = 'all' | 'resolved' | 'unresolved'

export default function AnalyticsClient({ analytics: initial }: AnalyticsClientProps) {
  const [analytics, setAnalytics] = useState(initial)
  const [filterText, setFilterText] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [resolving, setResolving] = useState<string | null>(null)
  const [similarFor, setSimilarFor] = useState<string | null>(null)
  const [similarResults, setSimilarResults] = useState<string[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [merging, setMerging] = useState(false)

  const filtered = useMemo(() => {
    return analytics.filter((a) => {
      if (filterText && !a.query_string.includes(filterText)) return false
      if (filterMode === 'resolved' && !a.resolved) return false
      if (filterMode === 'unresolved' && a.resolved) return false
      return true
    })
  }, [analytics, filterText, filterMode])

  async function handleResolve(queryString: string) {
    setResolving(queryString)
    const result = await resolveSearch(queryString)
    if (!result.error) {
      setAnalytics((prev) =>
        prev.map((a) =>
          a.query_string === queryString ? { ...a, resolved: true } : a
        )
      )
    }
    setResolving(null)
  }

  async function handleFindSimilar(queryString: string) {
    if (similarFor === queryString) {
      setSimilarFor(null)
      setSimilarResults([])
      return
    }
    setSimilarFor(queryString)
    setLoadingSimilar(true)
    try {
      const res = await fetch(`/api/similar-searches?q=${encodeURIComponent(queryString)}`)
      const json = await res.json()
      setSimilarResults(
        (json.data ?? [])
          .map((d: { query_string: string }) => d.query_string)
          .filter((s: string) => s !== queryString)
      )
    } catch {
      setSimilarResults([])
    }
    setLoadingSimilar(false)
  }

  async function handleMerge(primary: string, duplicates: string[]) {
    setMerging(true)
    const result = await mergeSearches(primary, duplicates)
    if (!result.error) {
      setAnalytics((prev) => prev.filter((a) => !duplicates.includes(a.query_string)))
      setSimilarFor(null)
      setSimilarResults([])
    }
    setMerging(false)
  }

  function exportCSV() {
    const header = 'query_string,search_count,resolved,last_searched\n'
    const rows = filtered
      .map(
        (a) =>
          `"${a.query_string.replace(/"/g, '""')}",${a.search_count},${a.resolved},${a.last_searched}`
      )
      .join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'search-analytics.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="סנן לפי טקסט..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="ps-9"
            dir="auto"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unresolved', 'resolved'] as FilterMode[]).map((mode) => (
            <Button
              key={mode}
              variant={filterMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode(mode)}
            >
              {mode === 'all' ? 'הכל' : mode === 'resolved' ? 'טופלו' : 'לא טופלו'}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 me-1" />
          ייצוא CSV
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} תוצאות</p>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.query_string}>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium" dir="auto">
                    {item.query_string}
                  </span>
                  {item.resolved && (
                    <Badge variant="default" className="bg-green-600">טופל</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{item.search_count} חיפושים</span>
                  {!item.resolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResolve(item.query_string)}
                      disabled={resolving === item.query_string}
                    >
                      {resolving === item.query_string ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="ms-1">סמן כטופל</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFindSimilar(item.query_string)}
                  >
                    <Merge className="h-4 w-4 me-1" />
                    דומים
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar searches panel */}
            {similarFor === item.query_string && (
              <Card className="mt-1 ms-4 border-dashed">
                <CardContent className="py-3">
                  {loadingSimilar ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> מחפש דומים...
                    </div>
                  ) : similarResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">לא נמצאו חיפושים דומים</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">חיפושים דומים:</p>
                      <div className="flex flex-wrap gap-1">
                        {similarResults.map((s) => (
                          <Badge key={s} variant="secondary" dir="auto">{s}</Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={merging}
                        onClick={() => handleMerge(item.query_string, similarResults)}
                      >
                        {merging ? (
                          <Loader2 className="h-4 w-4 me-1 animate-spin" />
                        ) : (
                          <Merge className="h-4 w-4 me-1" />
                        )}
                        מיזוג לתוך &ldquo;{item.query_string}&rdquo;
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
