import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

const ADMIN_LINKS = [
  { href: '/admin', label: 'סקירה' },
  { href: '/admin/users', label: 'משתמשים' },
  { href: '/admin/animes', label: 'אנימות' },
  { href: '/admin/fansubs', label: 'קבוצות' },
  { href: '/admin/applications', label: 'בקשות' },
  { href: '/admin/analytics', label: 'אנליטיקה' },
  { href: '/admin/form-builder', label: 'טופס בקשה' },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <div>
      <nav className="border-b bg-muted/40">
        <div className="container mx-auto max-w-6xl px-4 flex items-center gap-4 overflow-x-auto h-12 text-sm">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  )
}
