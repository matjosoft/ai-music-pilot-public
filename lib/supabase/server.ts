import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

/**
 * Create a Supabase client with service role key
 * This bypasses Row-Level Security and should only be used in trusted server-side code
 * Use for administrative operations like creating subscriptions, logging usage, etc.
 *
 * SECURITY: The service role key grants full database access, bypassing all RLS policies.
 * Never expose this key to the client or log it.
 */
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not configured')
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not configured. This key is required for server-side administrative operations.')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
