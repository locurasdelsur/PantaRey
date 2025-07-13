import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Create a supabase client configured to use cookies
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
