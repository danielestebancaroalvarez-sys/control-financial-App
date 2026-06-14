import { getPeriodRange } from '@/lib/finance/format'
import type { Period } from '@/lib/finance/types'
import { createClient } from '@/utils/supabase/server'
import type { WeeklyInsight } from '@/lib/finance/types'

function getInsightCacheKey(period: Period): string {
  const { start } = getPeriodRange(period)
  return period === 'weekly' ? `w:${start}` : start.slice(0, 7)
}

export type CachedWeeklyInsight = WeeklyInsight & {
  dataFingerprint: string | null
}

export async function getCachedWeeklyInsight(
  householdId: string,
  period: Period = 'monthly'
): Promise<CachedWeeklyInsight | null> {
  const supabase = await createClient()
  const periodKey = getInsightCacheKey(period)

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
  dataFingerprint: string,
  period: Period = 'monthly'
): Promise<void> {
  const supabase = await createClient()
  const periodKey = getInsightCacheKey(period)

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
