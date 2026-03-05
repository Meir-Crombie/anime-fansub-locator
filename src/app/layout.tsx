import type { Metadata } from 'next'
import { Heebo, Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Navbar from '@/components/Navbar'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Israeli Anime Fansub Hub | מרכז הפאנסאב הישראלי',
  description: 'מצא איזה קבוצת פאנסאב תירגמה את האנימה שלך לעברית',
  keywords: ['אנימה', 'מנגה', 'פאנסאב', 'תרגום לעברית', 'anime', 'manga', 'fansub'],
  openGraph: {
    title: 'מרכז הפאנסאב הישראלי',
    description: 'מצא פאנסאבים בעברית עבור האנימה האהובה עליך',
    locale: 'he_IL',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-heebo antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
