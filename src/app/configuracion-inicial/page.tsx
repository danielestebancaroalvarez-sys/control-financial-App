import { redirect } from 'next/navigation'
import { getSetupContext, hasCompletedSetup } from '@/lib/setup/queries'
import { SetupWizard } from './setup-wizard'

type SearchParams = Promise<{ review?: string }>

export default async function ConfiguracionInicialPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const isReview = params.review === '1'

  const [completed, context] = await Promise.all([
    hasCompletedSetup(),
    getSetupContext(),
  ])

  if (completed && !isReview) redirect('/')
  if (!context) redirect('/onboarding')

  return <SetupWizard context={context} isReview={isReview} />
}
