'use client'

import { useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { activateAssistant } from '@/lib/setup/assistant-actions'
import { moduleHomePath } from '@/lib/app/module'
import type { AssistantModule } from '@/lib/setup/assistant-types'

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
      router.replace(moduleHomePath(module), { scroll: false })
      router.refresh()
    })
  }, [searchParams, router])

  return null
}
