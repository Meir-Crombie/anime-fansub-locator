import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import UserSubmissionForm from '@/components/forms/UserSubmissionForm'

export default async function SubmitPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <UserSubmissionForm />
}
