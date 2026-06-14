'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Period } from '@/lib/finance/types'
import type { ThemePreference } from '@/components/theme/apply-theme'
import { ensureUserProfile } from './sync'

const REVALIDATE_PATHS = ['/', '/buscar', '/ahorros', '/predicciones', '/nuevo', '/ajustes']

function revalidateApp() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

export async function updateDashboardPeriod(
  period: Period
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  await ensureUserProfile()

  const { data, error } = await supabase
    .from('profiles')
    .update({ dashboard_period: period })
    .eq('id', user.id)
    .select('dashboard_period')
    .maybeSingle()

  if (error) return { error: error.message }

  if (!data || data.dashboard_period !== period) {
    return { error: 'No se pudo guardar la preferencia. Intenta de nuevo.' }
  }

  revalidateApp()
  return {}
}

export async function updateTheme(
  theme: ThemePreference
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  await ensureUserProfile()

  const { data, error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('id', user.id)
    .select('theme')
    .maybeSingle()

  if (error) return { error: error.message }

  if (!data || data.theme !== theme) {
    return { error: 'No se pudo guardar el tema. Intenta de nuevo.' }
  }

  revalidateApp()
  return {}
}
