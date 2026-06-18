import { createClient } from '@/utils/supabase/server'

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function buildAvatarStoragePath(userId: string) {
  return `${userId}/avatar.jpg`
}

export async function uploadUserAvatar(
  userId: string,
  file: Blob,
  mimeType: string
): Promise<{ error?: string; url?: string }> {
  if (!AVATAR_MIME_TYPES.includes(mimeType as (typeof AVATAR_MIME_TYPES)[number])) {
    return { error: 'Formato de imagen no permitido.' }
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { error: 'La imagen supera el límite de 2 MB.' }
  }

  const supabase = await createClient()
  const path = buildAvatarStoragePath(userId)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    return { error: 'No se pudo guardar la foto de perfil.' }
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = data.publicUrl
    ? `${data.publicUrl}?v=${Date.now()}`
    : undefined

  if (!url) return { error: 'No se pudo obtener la URL de la foto.' }

  return { url }
}
