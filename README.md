# anime-fansub-locator

A community directory where Israeli users can discover which local fansub groups have translated which anime titles, the translation status, and where to watch them.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS + shadcn/ui | Dark mode via `next-themes` |
| Database | Supabase PostgreSQL | With `pg_trgm` extension |
| Auth | Supabase GoTrue | Magic Link + Email/Password |
| Storage | Supabase Storage | Cover images and fansub logos |
| Validation | Zod | Server Actions and Route Handlers |
| Hosting | Vercel | ISR + `revalidatePath` after mutations |
| Performance | `@vercel/speed-insights` | Real-user performance metrics via Vercel Speed Insights; added to the root layout so all pages are automatically instrumented |

## Getting Started

Copy `.env.example` to `.env.local` and fill in your Supabase and site URL values, then:

```bash
npm install
npm run dev
```