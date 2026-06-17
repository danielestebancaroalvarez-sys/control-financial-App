import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getAuthUser } from '@/lib/auth/session'
import { getHouseholdTasks } from '@/lib/time/queries'
import { TiempoTareasClient } from './tiempo-tareas-client'

export default async function TiempoTareasPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const user = await getAuthUser()
  const tasks = await getHouseholdTasks(ctx.household.id)

  return (
    <TiempoTareasClient
      tasks={tasks}
      householdId={ctx.household.id}
      currentUserId={user!.id}
    />
  )
}
