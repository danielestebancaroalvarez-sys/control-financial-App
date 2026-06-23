import { createClient } from '@/utils/supabase/server'
import { estimateContributionFromTargetDate } from '@/lib/finance/savings-plan'

export async function syncTripSavingsTarget(
  savingsGoalId: string,
  targetAmount: number,
  tripName: string,
  targetDate: string
): Promise<void> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('savings_goals')
    .select(
      'current_amount, contribution_frequency, savings_mode, annual_interest_rate'
    )
    .eq('id', savingsGoalId)
    .maybeSingle()

  const current = Number(existing?.current_amount ?? 0)
  const frequency =
    (existing?.contribution_frequency as 'weekly' | 'monthly' | null) ?? 'monthly'

  const contribution = estimateContributionFromTargetDate(
    {
      target_amount: Math.max(1, targetAmount),
      current_amount: current,
      contribution_amount: null,
      contribution_frequency: frequency,
      savings_mode: existing?.savings_mode ?? 'static',
      annual_interest_rate: existing?.annual_interest_rate
        ? Number(existing.annual_interest_rate)
        : null,
      target_date: targetDate,
    },
    targetDate,
    frequency
  )

  await supabase
    .from('savings_goals')
    .update({
      name: `Viaje: ${tripName}`,
      category: 'vacation',
      icon: 'plane',
      color: '#2DD4BF',
      target_amount: Math.max(1, targetAmount),
      target_date: targetDate,
      contribution_amount: contribution,
      contribution_frequency: frequency,
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
