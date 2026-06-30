'use client'

import { useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { activateAssistant } from '@/lib/setup/assistant-actions'
import { getNextFinanceStepHref } from '@/lib/setup/tour-advance'

export function AssistantActivateHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    const raw = searchParams.get('activateAssistant')
    if (raw !== 'finance') return

    startTransition(async () => {
      await activateAssistant('finance')
      const next = await getNextFinanceStepHref()
      router.replace(next ?? '/', { scroll: false })
      router.refresh()
    })
  }, [searchParams, router])

  return null
}
