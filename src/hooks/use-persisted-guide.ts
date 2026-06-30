'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Mantiene el paso del asistente aunque se quite ?guide= de la URL al cerrar el modal.
 */
export function usePersistedGuideParam<T extends string>(
  parse: (raw: string | null | undefined) => T | null,
  initialFromServer?: T | null
) {
  const searchParams = useSearchParams()
  const urlGuide = useMemo(
    () => parse(searchParams.get('guide')),
    [searchParams, parse]
  )
  const [persisted, setPersisted] = useState<T | null>(
    () => urlGuide ?? initialFromServer ?? null
  )

  useEffect(() => {
    if (urlGuide) setPersisted(urlGuide)
  }, [urlGuide])

  const effectiveGuide = urlGuide ?? persisted

  return {
    urlGuide,
    effectiveGuide,
    locked: effectiveGuide !== null,
  }
}

/** Desplaza al bloque correcto cuando el usuario cierra el modal de guía. */
export function useScrollOnGuideDismiss(scrollTargetId: string) {
  const searchParams = useSearchParams()
  const prevGuide = useRef<string | null>(searchParams.get('guide'))

  useEffect(() => {
    const current = searchParams.get('guide')
    if (prevGuide.current && !current) {
      requestAnimationFrame(() => {
        document.getElementById(scrollTargetId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
    prevGuide.current = current
  }, [searchParams, scrollTargetId])
}
