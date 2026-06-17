import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getHouseholdTasks, getProductivityGoals } from '@/lib/time/queries'
import { TiempoBuscarClient } from './tiempo-buscar-client'

export default async function TiempoBuscarPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const [tasks, goals] = await Promise.all([
    getHouseholdTasks(ctx.household.id),
    getProductivityGoals(ctx.household.id),
  ])

  return (
    <TiempoBuscarClient
      tasks={tasks}
      goals={goals}
      householdId={ctx.household.id}
    />
  )
}
