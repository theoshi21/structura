// Supabase client configuration
// Requirements: 9.1, 9.2

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/** Singleton server-side client — reused across requests in the same process */
let serverClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase client for server-side operations.
 * Reusing the client avoids the overhead of creating a new connection on every request.
 */
export function createSupabaseClient(): SupabaseClient {
  if (serverClient) return serverClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  serverClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serverClient
}

/**
 * Creates a Supabase client for client-side operations.
 * Uses the anon key for public operations.
 */
export function createSupabaseClientPublic() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
