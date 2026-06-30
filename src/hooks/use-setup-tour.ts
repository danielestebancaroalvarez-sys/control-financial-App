'use client'

import { useEffect, useRef } from 'react'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/lib/setup/tour-theme.css'
import { getTourDriverSteps, type TourStepId } from '@/lib/setup/tour-config'

async function waitForSelector(selector: string, maxMs = 6000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (document.querySelector(selector)) return true
    await new Promise(resolve => setTimeout(resolve, 80))
  }
  return false
}

function resolveAvailableSteps(tourId: TourStepId) {
  const steps = getTourDriverSteps(tourId)
  return steps.filter(step => {
    if (!step.element || typeof step.element !== 'string') return true
    return !!document.querySelector(step.element)
  })
}

export function useSetupTour({
  tourId,
  onClose,
}: {
  tourId: TourStepId | null
  onClose: () => void
}) {
  const driverRef = useRef<Driver | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!tourId) return

    let cancelled = false

    async function start() {
      const rawSteps = getTourDriverSteps(tourId!)
      for (const step of rawSteps) {
        if (typeof step.element === 'string') {
          await waitForSelector(step.element)
        }
      }
      if (cancelled) return

      const steps = resolveAvailableSteps(tourId!)
      if (steps.length === 0) return

      driverRef.current?.destroy()

      const instance = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'cc-tour-popover',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Listo',
        steps,
        onDestroyed: () => {
          driverRef.current = null
          onCloseRef.current()
        },
      })

      driverRef.current = instance
      instance.drive()
    }

    const timer = window.setTimeout(() => {
      void start()
    }, 120)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [tourId])
}
