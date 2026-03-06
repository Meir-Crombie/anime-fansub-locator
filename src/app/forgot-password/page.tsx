'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await forgotPassword(formData)

    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setIsLoading(false)
  }

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-5xl">📧</div>
            <h2 className="text-xl font-bold">בדוק את תיבת הדואר</h2>
            <p className="text-muted-foreground">
              אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס הסיסמה.
            </p>
            <Link href="/login">
              <Button variant="outline">חזרה לדף ההתחברות</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">שכחת סיסמה?</CardTitle>
          <CardDescription>
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                כתובת אימייל
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Mail className="h-4 w-4" aria-hidden />
              )}
              שלח קישור איפוס
            </Button>
          </form>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="text-primary font-medium hover:underline">
              חזרה להתחברות
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
