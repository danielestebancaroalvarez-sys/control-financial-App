import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getCategories } from '@/lib/finance/queries'
import { getFirstName } from '@/lib/utils/name'
import { NuevoClient } from './nuevo-client'

export default async function NuevoPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const categories = await getCategories(ctx.household.id)
  const displayName =
    ctx.user.user_metadata?.full_name ??
    ctx.user.user_metadata?.name ??
    ctx.user.email?.split('@')[0] ??
    'Usuario'

  return (
    <NuevoClient
      householdId={ctx.household.id}
      baseCurrency={ctx.household.base_currency}
      categories={categories}
      authorName={getFirstName(displayName)}
    />
  )
}
