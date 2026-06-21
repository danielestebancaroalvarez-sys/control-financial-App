'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const TIME_PATHS = ['/tiempo', '/tiempo/buscar', '/tiempo/nuevo', '/tiempo/ajustes']

function revalidateSleep() {
  for (const path of TIME_PATHS) revalidatePath(path)
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatLocalTime(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function minutesBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
}

async function getSleepCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('time_categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('name', 'Sueño')
    .maybeSingle()

  return data?.id ?? null
}

async function createSleepTimeEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  userId: string,
  startedAt: Date,
  endedAt: Date
): Promise<{ error?: string; id?: string }> {
  const categoryId = await getSleepCategoryId(supabase, householdId)
  if (!categoryId) return { error: 'No se encontró la categoría Sueño.' }

  const durationMinutes = minutesBetween(startedAt, endedAt)

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      household_id: householdId,
      user_id: userId,
      category_id: categoryId,
      title: 'Sueño',
      entry_date: formatLocalDate(startedAt),
      duration_minutes: durationMinutes,
      start_time: formatLocalTime(startedAt),
      end_time: formatLocalTime(endedAt),
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'No se pudo registrar el sueño.' }
  return { id: data.id }
}

export async function startSleepSession(
  householdId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: active } = await supabase
    .from('sleep_sessions')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle()

  if (active) return { error: 'Ya tienes una sesión de sueño activa.' }

  const { error } = await supabase.from('sleep_sessions').insert({
    household_id: householdId,
    user_id: user.id,
    started_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  revalidateSleep()
  return {}
}

export async function endSleepSession(
  householdId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: session } = await supabase
    .from('sleep_sessions')
    .select('id, started_at')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle()

  if (!session) return { error: 'No hay una sesión de sueño activa.' }

  const endedAt = new Date()
  const startedAt = new Date(session.started_at)

  const entry = await createSleepTimeEntry(supabase, householdId, user.id, startedAt, endedAt)
  if (entry.error) return { error: entry.error }

  const { error } = await supabase
    .from('sleep_sessions')
    .update({
      ended_at: endedAt.toISOString(),
      time_entry_id: entry.id ?? null,
    })
    .eq('id', session.id)

  if (error) return { error: error.message }
  revalidateSleep()
  return {}
}

export async function logSleepManual(
  householdId: string,
  startedAtIso: string,
  endedAtIso: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const startedAt = new Date(startedAtIso)
  const endedAt = new Date(endedAtIso)
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    return { error: 'Fechas inválidas.' }
  }
  if (endedAt <= startedAt) {
    return { error: 'La hora de despertar debe ser posterior a la de dormir.' }
  }

  const entry = await createSleepTimeEntry(supabase, householdId, user.id, startedAt, endedAt)
  if (entry.error) return { error: entry.error }

  const { error } = await supabase.from('sleep_sessions').insert({
    household_id: householdId,
    user_id: user.id,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    time_entry_id: entry.id ?? null,
  })

  if (error) return { error: error.message }
  revalidateSleep()
  return {}
}
