import type { SupabaseClient } from '@supabase/supabase-js'

export async function applySavingsGoalDelta(
  supabase: SupabaseClient,
  goalId: string,
  householdId: string,
  delta: number
): Promise<void> {
  if (delta === 0) return

  const { data: goal } = await supabase
    .from('savings_goals')
    .select('current_amount, target_amount')
    .eq('id', goalId)
    .eq('household_id', householdId)
    .single()

  if (!goal) return

  const target = Number(goal.target_amount)
  const next = Math.max(0, Math.min(target, Number(goal.current_amount) + delta))

  await supabase
    .from('savings_goals')
    .update({ current_amount: Math.round(next * 100) / 100 })
    .eq('id', goalId)
    .eq('household_id', householdId)
}

export async function getSavingsContributionCategoryId(
  supabase: SupabaseClient,
  householdId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .eq('name', 'Ahorro')
    .maybeSingle()

  if (data?.id) return data.id

  const { data: fallback } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .limit(1)
    .maybeSingle()

  return fallback?.id ?? null
}
