import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.redirect(`${origin}/login?error=config_error`)
    }

    // Use cookies() from next/headers — in a Route Handler this is tied to the
    // response, so Set-Cookie headers written via cookieStore.set() are
    // automatically included in the returned response (including redirects).
    const cookieStore = cookies()

    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // On Vercel (behind a load balancer), req.url may contain an internal IP.
      // x-forwarded-host gives us the real public hostname.
      const forwardedHost = req.headers.get('x-forwarded-host')
      if (process.env.NODE_ENV === 'development' || !forwardedHost) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
