import { redirect } from 'next/navigation'
import {
  getTravelSetupContext,
  hasCompletedTravelSetup,
} from '@/lib/setup/queries'
import { TravelSetupWizard } from './travel-setup-wizard'

export default async function ViajesConfiguracionInicialPage() {
  const [completed, context] = await Promise.all([
    hasCompletedTravelSetup(),
    getTravelSetupContext(),
  ])

  if (completed) redirect('/viajes')
  if (!context) redirect('/onboarding')

  return (
    <TravelSetupWizard
      householdName={context.householdName}
      currency={context.currency}
    />
  )
}
