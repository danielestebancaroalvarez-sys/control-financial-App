import { createClient } from '@/utils/supabase/server'

const GOAL_IMAGE_MAX_BYTES = 2 * 1024 * 1024
const GOAL_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function buildGoalImageStoragePath(householdId: string, goalId: string) {
  return `${householdId}/${goalId}.jpg`
}

export async function uploadGoalImage(
  householdId: string,
  goalId: string,
  file: Blob,
  mimeType: string
): Promise<{ error?: string; path?: string }> {
  if (!GOAL_IMAGE_MIME_TYPES.includes(mimeType as (typeof GOAL_IMAGE_MIME_TYPES)[number])) {
    return { error: 'Formato de imagen no permitido.' }
  }

  if (file.size > GOAL_IMAGE_MAX_BYTES) {
    return { error: 'La imagen supera el límite de 2 MB.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: goal } = await supabase
    .from('productivity_goals')
    .select('id')
    .eq('id', goalId)
    .eq('household_id', householdId)
    .maybeSingle()

  if (!goal) return { error: 'Meta no encontrada.' }

  const path = buildGoalImageStoragePath(householdId, goalId)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('goal-images')
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    return { error: 'No se pudo guardar la imagen.' }
  }

  const { error: updateError } = await supabase
    .from('productivity_goals')
    .update({ image_path: path })
    .eq('id', goalId)
    .eq('household_id', householdId)

  if (updateError) {
    return { error: 'Imagen subida pero no se pudo vincular a la meta.' }
  }

  return { path }
}
