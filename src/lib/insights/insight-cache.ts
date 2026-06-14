import { createClient } from '@/utils/supabase/server'
import type { WeeklyInsight } from '@/lib/finance/types'

function getWeekKey(): string {
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start.toISOString().slice(0, 10)
}

export async function getCachedWeeklyInsight(
  householdId: string
): Promise<WeeklyInsight | null> {
  const supabase = await createClient()
  const weekKey = getWeekKey()

  const { data } = await supabase
    .from('household_weekly_insights')
    .select('summary, tips, generated_at')
    .eq('household_id', householdId)
    .eq('week_key', weekKey)
    .maybeSingle()

  if (!data) return null

  return {
    summary: data.summary,
    tips: Array.isArray(data.tips) ? data.tips.map(String) : [],
    generatedAt: data.generated_at,
  }
}

export async function saveWeeklyInsight(
  householdId: string,
  insight: WeeklyInsight
): Promise<void> {
  const supabase = await createClient()
  const weekKey = getWeekKey()

  await supabase.from('household_weekly_insights').upsert(
    {
      household_id: householdId,
      week_key: weekKey,
      summary: insight.summary,
      tips: insight.tips,
      generated_at: insight.generatedAt,
    },
    { onConflict: 'household_id,week_key' }
  )
}
