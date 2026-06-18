import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

export async function processDueSavingsContributions(
  supabase?: SupabaseClient
): Promise<{
  processed: number
  error?: string
}> {
  const client = supabase ?? (await createClient())
  const { data, error } = await client.rpc('process_due_savings_contributions')

  if (error) {
    return { processed: 0, error: error.message }
  }

  return { processed: typeof data === 'number' ? data : 0 }
}
