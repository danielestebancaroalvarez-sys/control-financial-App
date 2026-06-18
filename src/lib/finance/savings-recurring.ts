import { createClient } from '@/utils/supabase/server'

export async function processDueSavingsContributions(): Promise<{
  processed: number
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('process_due_savings_contributions')

  if (error) {
    return { processed: 0, error: error.message }
  }

  return { processed: typeof data === 'number' ? data : 0 }
}
