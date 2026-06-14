import { createClient } from '@/utils/supabase/server'

export async function processDueRecurringSchedules(): Promise<{
  processed: number
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('process_due_recurring_schedules')

  if (error) {
    return { processed: 0, error: error.message }
  }

  return { processed: typeof data === 'number' ? data : 0 }
}
