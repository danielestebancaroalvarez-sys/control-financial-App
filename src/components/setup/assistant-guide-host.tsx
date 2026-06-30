'use client'

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getAppModule } from '@/lib/app/module'
import { parseGuideParam } from '@/lib/setup/assistant-guide-config'
import type { GuideStepConfig } from '@/lib/setup/assistant-guide-config'
import {
  clearPendingGuideOverlay,
  getPendingGuideOverlay,
  subscribeGuideOverlay,
} from '@/lib/setup/guide-overlay-store'
import { FloatingGuideModal } from './floating-guide-modal'

function resolveGuideStep(step: GuideStepConfig, pathname: string): GuideStepConfig {
  if (step.id === 'profile' && getAppModule(pathname) === 'time') {
    return {
      ...step,
      module: 'time',
      stepIndex: 1,
      totalSteps: 5,
      title: 'Completa tu nombre de perfil',
      description: 'Edita tu nombre para que aparezca en tareas y horario.',
    }
  }
  return step
}

function usePendingGuide() {
  return useSyncExternalStore(
    subscribeGuideOverlay,
    getPendingGuideOverlay,
    () => null
  )
}

function readGuideFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('guide')
}

export function AssistantGuideHost() {
  const pathname = usePathname()
  const router = useRouter()
  const pendingGuide = usePendingGuide()

  const urlGuide = useMemo(() => readGuideFromUrl(), [pathname, pendingGuide])

  const guideId = urlGuide ?? pendingGuide

  useEffect(() => {
    if (urlGuide && urlGuide === pendingGuide) {
      clearPendingGuideOverlay()
    }
  }, [urlGuide, pendingGuide])

  const step = useMemo(() => {
    if (!guideId) return null
    const parsed = parseGuideParam(guideId)
    return parsed ? resolveGuideStep(parsed, pathname) : null
  }, [guideId, pathname])

  const dismiss = useCallback(() => {
    clearPendingGuideOverlay()
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    params.delete('guide')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router])

  if (!step) return null

  return <FloatingGuideModal step={step} onDismiss={dismiss} />
}
