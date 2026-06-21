'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createTimeBlock } from '@/lib/time/actions'
import { minutesFromTimeRange } from '@/lib/time/format'
import { ensureUserProfile } from '@/lib/profile/sync'
import type { TimeSetupInput } from './time-types'

const REVALIDATE_PATHS = [
  '/tiempo',
  '/tiempo/buscar',
  '/tiempo/nuevo',
  '/tiempo/horario',
  '/tiempo/tareas',
  '/tiempo/metas',
  '/tiempo/ajustes',
  '/tiempo/configuracion-inicial',
]

function revalidateTimeApp() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

async function markTimeSetupCompleted(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  await ensureUserProfile()

  const { error } = await supabase
    .from('profiles')
    .update({ time_setup_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return {}
}

export async function completeTimeSetup(
  input: TimeSetupInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .eq('household_id', input.householdId)
    .maybeSingle()

  if (!membership) return { error: 'No perteneces a este hogar.' }

  if (input.createSleepBlock && input.sleepStartTime && input.sleepEndTime) {
    const { data: sleepCat } = await supabase
      .from('time_categories')
      .select('id')
      .eq('household_id', input.householdId)
      .eq('name', 'Sueño')
      .maybeSingle()

    if (sleepCat) {
      const today = new Date().toISOString().slice(0, 10)
      const blockResult = await createTimeBlock({
        householdId: input.householdId,
        categoryId: sleepCat.id,
        title: 'Sueño nocturno',
        frequency: 'daily',
        anchorDate: today,
        startTime: input.sleepStartTime,
        endTime: input.sleepEndTime,
        durationMinutes: minutesFromTimeRange(
          input.sleepStartTime,
          input.sleepEndTime
        ),
        assignedTo: user.id,
      })
      if (blockResult.error) return { error: blockResult.error }
    }
  }

  const done = await markTimeSetupCompleted()
  if (done.error) return done

  revalidateTimeApp()
  redirect('/tiempo')
}

export async function skipTimeSetup(): Promise<{ error?: string }> {
  const done = await markTimeSetupCompleted()
  if (done.error) return done

  revalidateTimeApp()
  redirect('/tiempo')
}
