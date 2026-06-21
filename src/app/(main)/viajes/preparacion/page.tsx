import { redirect } from 'next/navigation'
import { getMainAppContext } from '@/lib/app/context'
import { getAllPrepSteps } from '@/lib/travel/queries'
import { ViajesPreparacionClient } from './viajes-preparacion-client'

export default async function ViajesPreparacionPage() {
  const ctx = await getMainAppContext()
  if (!ctx) redirect('/login')

  const steps = await getAllPrepSteps(ctx.household.id)

  return (
    <ViajesPreparacionClient steps={steps} householdId={ctx.household.id} />
  )
}
