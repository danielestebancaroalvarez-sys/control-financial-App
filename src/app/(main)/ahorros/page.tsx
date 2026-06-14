import { createClient } from '@/utils/supabase/server'
import { getUserHousehold } from '@/lib/household/queries'
import { getSavingsGoals } from '@/lib/finance/queries'
import { AhorrosClient } from './ahorros-client'

export default async function AhorrosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const household = await getUserHousehold()
  if (!household || !user) return null

  const goals = await getSavingsGoals(household.id)

  return (
    <AhorrosClient
      goals={goals}
      householdId={household.id}
      currency={household.base_currency}
    />
  )
}
