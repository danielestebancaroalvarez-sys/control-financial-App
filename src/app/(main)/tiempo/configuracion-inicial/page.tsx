import { redirect } from 'next/navigation'
import {
  getTimeSetupContext,
  hasCompletedTimeSetup,
} from '@/lib/setup/queries'
import { TimeSetupWizard } from './time-setup-wizard'

type SearchParams = Promise<{ review?: string }>

export default async function TiempoConfiguracionInicialPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const isReview = params.review === '1'

  const [completed, context] = await Promise.all([
    hasCompletedTimeSetup(),
    getTimeSetupContext(),
  ])

  if (completed && !isReview) redirect('/tiempo')
  if (!context) redirect('/onboarding')

  return <TimeSetupWizard context={context} />
}
