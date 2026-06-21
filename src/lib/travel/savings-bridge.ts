import { createClient } from '@/utils/supabase/server'

export async function syncTripSavingsTarget(
  savingsGoalId: string,
  targetAmount: number,
  tripName: string,
  targetDate: string
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('savings_goals')
    .update({
      name: `Viaje: ${tripName}`,
      category: 'vacation',
      icon: 'plane',
      color: '#2DD4BF',
      target_amount: Math.max(1, targetAmount),
      target_date: targetDate,
    })
    .eq('id', savingsGoalId)
}

export async function fetchSavingsForTrip(savingsGoalId: string | null) {
  if (!savingsGoalId) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('savings_goals')
    .select(
      'id, name, target_amount, current_amount, target_date, contribution_amount, contribution_frequency, savings_mode, annual_interest_rate'
    )
    .eq('id', savingsGoalId)
    .maybeSingle()
  return data
}
