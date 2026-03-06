'use client'

import { useState } from 'react'
import Link from 'next/link'
import { registerUser } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    setError(null)

    const supabase = createClient()
    const siteUrl = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (error) {
      setError('שגיאה בהתחברות עם Google.')
      setIsGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await registerUser(formData)

    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else if (result && 'success' in result && result.success) {
      setSuccess(true)
    }
    setIsLoading(false)
  }

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-5xl">✉️</div>
            <h2 className="text-xl font-bold">נרשמת בהצלחה!</h2>
            <p className="text-muted-foreground">
              בדוק את תיבת הדואר שלך לאישור החשבון.
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
          <CardTitle className="text-2xl">הרשמה</CardTitle>
          <CardDescription>
            צור חשבון חדש כדי לנהל את קבוצת הפאנסאב שלך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            הירשם עם Google
          </Button>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">או</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/Password Registration */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium">
                שם פרטי
              </label>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="השם שלך"
                required
                minLength={2}
                autoComplete="given-name"
              />
            </div>
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
            <div className="space-y-2">
              <label htmlFor="age" className="text-sm font-medium">
                גיל
              </label>
              <Input
                id="age"
                name="age"
                type="number"
                min={13}
                max={120}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                סיסמה
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
                <UserPlus className="h-4 w-4" aria-hidden />
              )}
              הירשם
            </Button>
          </form>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <p className="text-sm text-muted-foreground text-center">
            כבר יש לך חשבון?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              התחבר
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
