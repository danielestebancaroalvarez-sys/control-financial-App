import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getMainAppContext } from '@/lib/app/context'
import { getCategories } from '@/lib/finance/queries'
import { getHouseholdMembers } from '@/lib/household/queries'
import { getUserProfile } from '@/lib/profile/queries'
import { getFirstName } from '@/lib/utils/name'
import { NuevoClient } from './nuevo-client'

export default async function NuevoPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [categories, profile, members] = await Promise.all([
    getCategories(ctx.household.id),
    getUserProfile(),
    getHouseholdMembers(ctx.household.id),
  ])

  const displayName = profile?.fullName ?? ctx.user.email?.split('@')[0] ?? 'Usuario'

  return (
    <Suspense fallback={null}>
      <NuevoClient
        householdId={ctx.household.id}
        baseCurrency={ctx.household.base_currency}
        categories={categories}
        members={members}
        currentUserId={ctx.user.id}
        authorName={getFirstName(displayName)}
        authorAvatarUrl={profile?.avatarUrl ?? null}
      />
    </Suspense>
  )
}
