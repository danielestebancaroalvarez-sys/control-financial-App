import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getAuthUser } from '@/lib/auth/session'
import { getWeeklySchedule, getMaxWeekOffsetWithData } from '@/lib/time/queries'
import { TiempoHorarioClient } from './tiempo-horario-client'

export default async function TiempoHorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ block?: string }>
}) {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const params = await searchParams
  const requestedOffset = Math.max(
    0,
    Math.min(11, parseInt(params.block ?? '0', 10) || 0)
  )
  const maxWeekOffset = await getMaxWeekOffsetWithData(ctx.household.id)
  const periodOffset = Math.min(requestedOffset, maxWeekOffset)
  const user = await getAuthUser()
  const schedule = await getWeeklySchedule(ctx.household.id, periodOffset)

  return (
    <TiempoHorarioClient
      periodStart={schedule.periodStart}
      periodEnd={schedule.periodEnd}
      events={schedule.events}
      members={schedule.members}
      periodOffset={periodOffset}
      maxWeekOffset={maxWeekOffset}
      currentUserId={user!.id}
    />
  )
}
