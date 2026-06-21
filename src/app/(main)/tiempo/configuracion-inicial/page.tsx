import { redirect } from 'next/navigation'
import {
  getTimeSetupContext,
  hasCompletedTimeSetup,
} from '@/lib/setup/queries'
import { TimeSetupWizard } from './time-setup-wizard'

export default async function TiempoConfiguracionInicialPage() {
  const [completed, context] = await Promise.all([
    hasCompletedTimeSetup(),
    getTimeSetupContext(),
  ])

  if (completed) redirect('/tiempo')
  if (!context) redirect('/onboarding')

  return <TimeSetupWizard context={context} />
}
