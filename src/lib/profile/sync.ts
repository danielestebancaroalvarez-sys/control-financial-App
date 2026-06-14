import { createClient } from '@/utils/supabase/server'
import type { User } from '@supabase/supabase-js'

function profilePayloadFromUser(user: User) {
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    null

  const metaAvatar =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null

  return { metaName, metaAvatar }
}

export async function ensureUserProfile(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { metaName, metaAvatar } = profilePayloadFromUser(user)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: metaName,
      avatar_url: metaAvatar,
    })
    return
  }

  const updates: Record<string, string> = {}
  if (metaName && !profile.full_name) updates.full_name = metaName
  if (metaAvatar && !profile.avatar_url) updates.avatar_url = metaAvatar

  if (Object.keys(updates).length > 0) {
    await supabase.from('profiles').update(updates).eq('id', user.id)
  }
}

export async function syncUserProfileFromMetadata(): Promise<void> {
  await ensureUserProfile()
}
