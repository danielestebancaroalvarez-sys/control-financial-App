import { createClient } from '@/utils/supabase/server'

export type SleepTrackerData = {
  sleepCategoryId: string | null
  activeSession: { id: string; startedAt: string } | null
  lastNightMinutes: number
  weeklyAverageMinutes: number
}

function minutesBetweenIso(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  return Math.max(0, Math.round((end - start) / 60000))
}

export async function getSleepTrackerData(
  householdId: string,
  userId: string
): Promise<SleepTrackerData> {
  const supabase = await createClient()

  const [{ data: sleepCat }, { data: active }, { data: recent }] = await Promise.all([
    supabase
      .from('time_categories')
      .select('id')
      .eq('household_id', householdId)
      .eq('name', 'Sueño')
      .maybeSingle(),
    supabase
      .from('sleep_sessions')
      .select('id, started_at')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .is('ended_at', null)
      .maybeSingle(),
    supabase
      .from('sleep_sessions')
      .select('started_at, ended_at')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(14),
  ])

  const completed = (recent ?? []).filter(s => s.ended_at)

  const lastNightMinutes =
    completed.length > 0
      ? minutesBetweenIso(completed[0].started_at, completed[0].ended_at!)
      : 0

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekSessions = completed.filter(
    s => new Date(s.ended_at!).getTime() >= weekAgo
  )
  const weeklyTotal = weekSessions.reduce(
    (sum, s) => sum + minutesBetweenIso(s.started_at, s.ended_at!),
    0
  )
  const weeklyAverageMinutes =
    weekSessions.length > 0 ? Math.round(weeklyTotal / weekSessions.length) : 0

  return {
    sleepCategoryId: sleepCat?.id ?? null,
    activeSession: active
      ? { id: active.id, startedAt: active.started_at }
      : null,
    lastNightMinutes,
    weeklyAverageMinutes,
  }
}
