import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getAuthUser } from '@/lib/auth/session'
import { getHouseholdMembers } from '@/lib/household/queries'
import { getTimeCategories } from '@/lib/time/queries'
import { TiempoNuevoClient } from './tiempo-nuevo-client'

export default async function TiempoNuevoPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; user?: string }>
}) {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const params = await searchParams
  const user = await getAuthUser()
  const [categories, members] = await Promise.all([
    getTimeCategories(ctx.household.id),
    getHouseholdMembers(ctx.household.id),
  ])

  return (
    <TiempoNuevoClient
      householdId={ctx.household.id}
      categories={categories}
      members={members}
      currentUserId={user!.id}
      initialDate={params.date}
      initialUserId={params.user}
    />
  )
}
