'use client'

import { GuideCoachBanner } from '@/components/setup/guide-coach-banner'

export function TiempoAjustesGuideBanner({ guide }: { guide: string | null }) {
  if (guide !== 'profile') return null
  return (
    <GuideCoachBanner
      module="time"
      stepIndex={1}
      totalSteps={4}
      title="Completa tu nombre de perfil"
    />
  )
}
