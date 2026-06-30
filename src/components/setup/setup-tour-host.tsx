'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSetupTour } from '@/hooks/use-setup-tour'
import { parseTourParam } from '@/lib/setup/tour-config'

export function SetupTourHost() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const tourId = parseTourParam(searchParams.get('tour'))

  const dismiss = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tour')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  useSetupTour({ tourId, onClose: dismiss })

  return null
}
