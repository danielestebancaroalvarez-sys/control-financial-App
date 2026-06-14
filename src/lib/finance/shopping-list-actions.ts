'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { normalizeProductName } from '@/lib/finance/market-product-keywords'

export async function toggleShoppingListItem(
  householdId: string,
  itemName: string,
  checked: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Debes iniciar sesión.' }

  const itemKey = normalizeProductName(itemName)
  if (!itemKey) return { error: 'Nombre de producto inválido.' }

  const { error } = await supabase.from('household_shopping_checks').upsert(
    {
      household_id: householdId,
      item_key: itemKey,
      item_name: itemName.trim(),
      is_checked: checked,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'household_id,item_key' }
  )

  if (error) return { error: error.message }

  revalidatePath('/mercado')
  return {}
}
