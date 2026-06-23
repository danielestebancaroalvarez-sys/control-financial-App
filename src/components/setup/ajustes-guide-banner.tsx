'use client'

import { GuideCoachBanner } from '@/components/setup/guide-coach-banner'

const GUIDE_COPY: Record<
  string,
  { module: 'finance' | 'time'; stepIndex: number; totalSteps: number; title: string }
> = {
  profile: {
    module: 'finance',
    stepIndex: 1,
    totalSteps: 5,
    title: 'Completa tu nombre de perfil',
  },
  period: {
    module: 'finance',
    stepIndex: 2,
    totalSteps: 5,
    title: 'Elige vista semanal o mensual',
  },
}

export function AjustesGuideBanner({ guide }: { guide: string | null }) {
  if (!guide || !GUIDE_COPY[guide]) return null
  const copy = GUIDE_COPY[guide]
  return (
    <GuideCoachBanner
      module={copy.module}
      stepIndex={copy.stepIndex}
      totalSteps={copy.totalSteps}
      title={copy.title}
    />
  )
}
