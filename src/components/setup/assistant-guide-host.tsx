'use client'

import { Suspense, useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getAppModule } from '@/lib/app/module'
import { parseGuideParam } from '@/lib/setup/assistant-guide-config'
import type { GuideStepConfig } from '@/lib/setup/assistant-guide-config'
import { FloatingGuideModal } from './floating-guide-modal'

function resolveGuideStep(step: GuideStepConfig, pathname: string): GuideStepConfig {
  if (step.id === 'profile' && getAppModule(pathname) === 'time') {
    return {
      ...step,
      module: 'time',
      stepIndex: 1,
      totalSteps: 4,
      title: 'Completa tu nombre de perfil',
      description: 'Edita tu nombre para que aparezca en tareas y horario.',
    }
  }
  return step
}

function AssistantGuideHostInner() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const guide = searchParams.get('guide')
  const step = useMemo(() => {
    const parsed = parseGuideParam(guide)
    return parsed ? resolveGuideStep(parsed, pathname) : null
  }, [guide, pathname])

  const dismiss = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('guide')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  if (!step) return null

  return <FloatingGuideModal step={step} onDismiss={dismiss} />
}

export function AssistantGuideHost() {
  return (
    <Suspense fallback={null}>
      <AssistantGuideHostInner />
    </Suspense>
  )
}
