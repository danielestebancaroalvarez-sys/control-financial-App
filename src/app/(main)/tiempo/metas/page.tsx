import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getHouseholdMembers } from '@/lib/household/queries'
import { getProductivityGoals } from '@/lib/time/queries'
import { TiempoMetasClient } from './tiempo-metas-client'

export default async function TiempoMetasPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [goals, members] = await Promise.all([
    getProductivityGoals(ctx.household.id),
    getHouseholdMembers(ctx.household.id),
  ])

  return (
    <TiempoMetasClient
      goals={goals}
      householdId={ctx.household.id}
      members={members}
      currentUserId={ctx.user.id}
    />
  )
}
