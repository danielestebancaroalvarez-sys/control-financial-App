'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

async function removeStoragePrefix(bucket: string, prefix: string) {
  const admin = createAdminClient()
  const { data: files } = await admin.storage.from(bucket).list(prefix, { limit: 200 })
  if (!files?.length) return

  const paths = files
    .filter(f => f.name && !f.name.endsWith('/'))
    .map(f => `${prefix}/${f.name}`)

  if (paths.length > 0) {
    await admin.storage.from(bucket).remove(paths)
  }
}

async function purgeHouseholdStorage(householdIds: string[]) {
  for (const householdId of householdIds) {
    await removeStoragePrefix('receipts', householdId)
    await removeStoragePrefix('goal-images', householdId)
  }
}

export async function deleteUserAccount(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const { data: deletedHouseholds, error: rpcError } = await supabase.rpc(
    'delete_user_account'
  )

  if (rpcError) return { error: rpcError.message }

  try {
    const admin = createAdminClient()

    await purgeHouseholdStorage((deletedHouseholds as string[] | null) ?? [])
    await admin.storage.from('avatars').remove([`${user.id}/avatar.jpg`])

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id)
    if (authDeleteError) {
      return { error: authDeleteError.message }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar la cuenta.'
    return { error: message }
  }

  await supabase.auth.signOut()
  redirect('/login?deleted=1')
}
