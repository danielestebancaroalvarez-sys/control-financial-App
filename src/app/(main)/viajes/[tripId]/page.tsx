import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getTrip } from '@/lib/travel/queries'
import { TripDetailClient } from '@/components/travel/trip-detail-client'

type SearchParams = Promise<{ tab?: string }>

export default async function ViajeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>
  searchParams: SearchParams
}) {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const { tripId } = await params
  const sp = await searchParams
  const tab = (sp.tab ?? 'summary') as 'summary' | 'budget' | 'prep' | 'itinerary'

  const trip = await getTrip(ctx.household.id, tripId)
  if (!trip) redirect('/viajes')

  return (
    <TripDetailClient
      trip={trip}
      currency={ctx.household.base_currency}
      householdId={ctx.household.id}
      initialTab={tab}
    />
  )
}
