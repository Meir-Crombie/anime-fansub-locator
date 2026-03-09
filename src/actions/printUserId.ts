// Server Action to print the current Supabase user id (for debugging RLS)
"use server"
import { createServerClient } from "@/lib/supabase/server";


export async function printUserId() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Supabase auth error:", error);
    return { error: error.message };
  }
  console.log("user id:", user?.id);
  return { userId: user?.id };
}

// Server Action: check is_admin() for current session
export async function checkIsAdminSession() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('is_admin() error:', error);
    return { error: error.message };
  }
  return { isAdmin: data };
}
