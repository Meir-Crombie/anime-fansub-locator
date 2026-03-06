'use client'

import { useState } from 'react'
import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, KeyRound } from 'lucide-react'

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await resetPassword(formData)

    // If resetPassword succeeds it calls redirect() and never returns.
    if (result?.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">איפוס סיסמה</CardTitle>
          <CardDescription>
            הזן סיסמה חדשה לחשבון שלך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                סיסמה חדשה
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                לפחות 8 תווים, אות אחת וספרה אחת
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm_password" className="text-sm font-medium">
                אימות סיסמה
              </label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                dir="ltr"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <KeyRound className="h-4 w-4" aria-hidden />
              )}
              עדכן סיסמה
            </Button>
          </form>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
