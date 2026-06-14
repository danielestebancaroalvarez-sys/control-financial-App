import { createClient } from '@/utils/supabase/server'
import type { WeeklyInsight } from '@/lib/finance/types'

function getPeriodKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export type CachedWeeklyInsight = WeeklyInsight & {
  dataFingerprint: string | null
}

export async function getCachedWeeklyInsight(
  householdId: string
): Promise<CachedWeeklyInsight | null> {
  const supabase = await createClient()
  const periodKey = getPeriodKey()

  const { data } = await supabase
    .from('household_weekly_insights')
    .select('summary, tips, generated_at, data_fingerprint')
    .eq('household_id', householdId)
    .eq('week_key', periodKey)
    .maybeSingle()

  if (!data) return null

  return {
    summary: data.summary,
    tips: Array.isArray(data.tips) ? data.tips.map(String) : [],
    generatedAt: data.generated_at,
    dataFingerprint: data.data_fingerprint ?? null,
  }
}

export async function saveWeeklyInsight(
  householdId: string,
  insight: WeeklyInsight,
  dataFingerprint: string
): Promise<void> {
  const supabase = await createClient()
  const periodKey = getPeriodKey()

  await supabase.from('household_weekly_insights').upsert(
    {
      household_id: householdId,
      week_key: periodKey,
      summary: insight.summary,
      tips: insight.tips,
      generated_at: insight.generatedAt,
      data_fingerprint: dataFingerprint,
    },
    { onConflict: 'household_id,week_key' }
  )
}
