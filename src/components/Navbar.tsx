'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, Menu, LogOut, LayoutDashboard, Shield,
  BarChart3, FileText, Settings, Film, Users, ClipboardList,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'דף הבית' },
  { href: '/search', label: 'אנימות' },
  { href: '/fansubs', label: 'קבוצות' },
]

const ADMIN_NAV_LINKS: { href: string; label: string; icon: typeof Shield }[] = [
  { href: '/admin', label: 'סקירה', icon: LayoutDashboard },
  { href: '/admin/animes', label: 'אנימות', icon: Film },
  { href: '/admin/fansubs', label: 'קבוצות', icon: Users },
  { href: '/admin/applications', label: 'בקשות', icon: ClipboardList },
  { href: '/admin/analytics', label: 'אנליטיקה', icon: BarChart3 },
  { href: '/admin/form-builder', label: 'טופס בקשה', icon: Settings },
]

interface NavbarProps {
  initialLoggedIn?: boolean
  initialEmail?: string | null
  initialRole?: string | null
}

export default function Navbar({ initialLoggedIn, initialEmail, initialRole }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(initialRole ?? null)
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn ?? false)
  const [email, setEmail] = useState(initialEmail ?? null)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u)
      setIsLoggedIn(!!u)
      setEmail(u?.email ?? null)
      if (u) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', u.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setRole(data.role)
          })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoggedIn(!!session?.user)
      setEmail(session?.user?.email ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role) setRole(data.role)
          })
      } else {
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const loggedIn = user ? true : isLoggedIn
  const displayEmail = user?.email ?? email

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span>🎌</span>
          <span>Fansub Hub</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              className={cn(
                'text-sm transition-colors',
                pathname === link.href
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Management dropdown for admin/manager - visible in desktop nav */}
          {loggedIn && (isAdmin || isManager) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1.5 text-sm transition-colors',
                    pathname.startsWith('/admin') || pathname.startsWith('/dashboard')
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span>ניהול</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {/* Manager section — visible to both admin and manager */}
                {(isAdmin || isManager) && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      הקבוצה שלי
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={'/dashboard' as never} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>לוח בקרה</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={'/dashboard/edit' as never} className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>תרגום חדש</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* Admin section — only for admins */}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      ניהול מערכת
                    </DropdownMenuLabel>
                    {ADMIN_NAV_LINKS.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href as never} className="flex items-center gap-2">
                          <link.icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side: auth + theme */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="החלף ערכת נושא"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Auth state */}
          {loggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {displayEmail?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground" dir="ltr">{displayEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>התנתקות</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">כניסה</Link>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="תפריט">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href as never}
                    className={cn(
                      'text-base py-2 px-3 rounded-md transition-colors',
                      pathname === link.href
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Manager/Admin mobile section */}
                {loggedIn && (isAdmin || isManager) && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground px-3 font-medium">הקבוצה שלי</p>
                    <Link
                      href={'/dashboard' as never}
                      className={cn(
                        'text-base py-2 px-3 rounded-md transition-colors flex items-center gap-2',
                        pathname === '/dashboard'
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-accent/50'
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      לוח בקרה
                    </Link>
                    <Link
                      href={'/dashboard/edit' as never}
                      className={cn(
                        'text-base py-2 px-3 rounded-md transition-colors flex items-center gap-2',
                        pathname === '/dashboard/edit'
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-accent/50'
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      תרגום חדש
                    </Link>
                  </>
                )}

                {loggedIn && isAdmin && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground px-3 font-medium">ניהול מערכת</p>
                    {ADMIN_NAV_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href as never}
                        className={cn(
                          'text-base py-2 px-3 rounded-md transition-colors flex items-center gap-2',
                          pathname === link.href
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-accent/50'
                        )}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
