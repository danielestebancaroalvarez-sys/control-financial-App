'use client'

import { useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { activateAssistant } from '@/lib/setup/assistant-actions'
import { moduleHomePath } from '@/lib/app/module'
import type { AssistantModule } from '@/lib/setup/assistant-types'
import { getNextModuleStepHref } from '@/lib/setup/tour-advance'

export function AssistantActivateHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    const raw = searchParams.get('activateAssistant')
    if (raw !== 'finance' && raw !== 'time') return

    const module = raw as AssistantModule
    startTransition(async () => {
      await activateAssistant(module)
      const next = await getNextModuleStepHref(module)
      router.replace(next ?? moduleHomePath(module), { scroll: false })
      router.refresh()
    })
  }, [searchParams, router])

  return null
}
