import { redirect } from 'next/navigation'
import { getSetupContext, hasCompletedSetup } from '@/lib/setup/queries'
import { SetupWizard } from './setup-wizard'

export default async function ConfiguracionInicialPage() {
  const [completed, context] = await Promise.all([
    hasCompletedSetup(),
    getSetupContext(),
  ])

  if (completed) redirect('/')
  if (!context) redirect('/onboarding')

  return <SetupWizard context={context} />
}
