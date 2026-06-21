import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTrips } from '@/lib/travel/queries'
import { ViajesBuscarClient } from './viajes-buscar-client'

export default async function ViajesBuscarPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const trips = await getTrips(ctx.household.id)

  return (
    <ViajesBuscarClient trips={trips} currency={ctx.household.base_currency} />
  )
}
