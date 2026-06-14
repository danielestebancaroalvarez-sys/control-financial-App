import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getCategories } from '@/lib/finance/queries'
import { AddSheet } from '@/components/layout/add-sheet'

export default async function NuevoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const categories = await getCategories(household.id)
  const authorName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuario'

  return (
    <AddSheet
      householdId={household.id}
      baseCurrency={household.base_currency}
      categories={categories}
      authorName={authorName}
    />
  )
}
