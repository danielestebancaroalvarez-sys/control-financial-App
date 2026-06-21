import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { TripCreateWizard } from '@/components/travel/trip-create-wizard'

export default async function ViajesNuevoPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  return (
    <TripCreateWizard
      householdId={ctx.household.id}
      currency={ctx.household.base_currency}
    />
  )
}
