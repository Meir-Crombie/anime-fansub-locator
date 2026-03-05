'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitRating } from '@/actions/ratings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface RatingWidgetProps {
  fansubId: string
}

interface RatingRow {
  id: string
  score: number
  review: string | null
  created_at: string
  user_id: string
}

export default function RatingWidget({ fansubId }: RatingWidgetProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [myRating, setMyRating] = useState<RatingRow | null>(null)
  const [allReviews, setAllReviews] = useState<RatingRow[]>([])
  const [hoverScore, setHoverScore] = useState(0)
  const [selectedScore, setSelectedScore] = useState(0)
  const [review, setReview] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      // Fetch all reviews
      const { data: reviews } = await supabase
        .from('ratings')
        .select('id, score, review, created_at, user_id')
        .eq('fansub_id', fansubId)
        .order('created_at', { ascending: false })
        .limit(10)

      setAllReviews((reviews ?? []) as RatingRow[])

      // Find user's own rating
      if (user) {
        const mine = (reviews as RatingRow[] | null)?.find((r) => r.user_id === user.id) ?? null
        setMyRating(mine)
        if (mine) {
          setSelectedScore(mine.score)
          setReview(mine.review ?? '')
        }
      }

      setIsLoaded(true)
    }
    load()
  }, [fansubId])

  async function handleSubmit() {
    if (selectedScore === 0) return
    setIsSubmitting(true)
    setError(null)

    const result = await submitRating({
      fansub_id: fansubId,
      score: selectedScore,
      review: review.trim() || undefined,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setIsEditing(false)
      // Reload the page to reflect the new rating
      window.location.reload()
    }
    setIsSubmitting(false)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>דירוג הקבוצה</CardTitle>
        </CardHeader>
        <CardContent>
          {!userId ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">התחבר כדי לדרג</p>
              <Button asChild variant="outline">
                <Link href="/login">כניסה</Link>
              </Button>
            </div>
          ) : myRating && !isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">הדירוג שלך:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= myRating.score
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {myRating.review && <p className="text-sm">{myRating.review}</p>}
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                ערוך דירוג
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">בחר דירוג:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-0.5 transition-transform hover:scale-110"
                      onMouseEnter={() => setHoverScore(star)}
                      onMouseLeave={() => setHoverScore(0)}
                      onClick={() => setSelectedScore(star)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoverScore || selectedScore)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="כתוב ביקורת (אופציונלי)..."
                maxLength={1000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={selectedScore === 0 || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  שלח דירוג
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    ביטול
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Reviews */}
      {allReviews.filter((r) => r.review).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ביקורות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allReviews
              .filter((r) => r.review)
              .map((r) => (
                <div key={r.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
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
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{r.review}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
