'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Period } from '@/lib/finance/types'

export async function updateDashboardPeriod(
  period: Period
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('profiles')
    .update({ dashboard_period: period })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/ajustes')
  return {}
}
