import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getCategories } from '@/lib/finance/queries'
import { getUserProfile } from '@/lib/profile/queries'
import { getFirstName } from '@/lib/utils/name'
import { NuevoClient } from './nuevo-client'

export default async function NuevoPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [categories, profile] = await Promise.all([
    getCategories(ctx.household.id),
    getUserProfile(),
  ])

  const displayName = profile?.fullName ?? ctx.user.email?.split('@')[0] ?? 'Usuario'

  return (
    <NuevoClient
      householdId={ctx.household.id}
      baseCurrency={ctx.household.base_currency}
      categories={categories}
      authorName={getFirstName(displayName)}
      authorAvatarUrl={profile?.avatarUrl ?? null}
    />
  )
}
