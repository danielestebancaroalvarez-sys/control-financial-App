'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Period } from '@/lib/finance/types'
import type { ThemePreference } from '@/components/theme/apply-theme'
import { ensureUserProfile } from './sync'
import { uploadUserAvatar } from './upload-avatar'

const REVALIDATE_PATHS = ['/', '/buscar', '/ahorros', '/predicciones', '/nuevo', '/ajustes', '/configuracion-inicial']

function revalidateApp() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

export async function updateUserProfile(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const fullName = String(formData.get('fullName') ?? '').trim()
  if (fullName.length < 2) {
    return { error: 'Escribe tu nombre (mínimo 2 caracteres).' }
  }

  await ensureUserProfile()

  const updates: Record<string, string> = { full_name: fullName }
  const avatarFile = formData.get('avatar')

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const upload = await uploadUserAvatar(user.id, avatarFile, avatarFile.type || 'image/jpeg')
    if (upload.error) return { error: upload.error }
    if (upload.url) updates.avatar_url = upload.url
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { error: error.message }

  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      ...(updates.avatar_url ? { avatar_url: updates.avatar_url } : {}),
    },
  })

  revalidateApp()
  return {}
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
