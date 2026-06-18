'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(error => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PWA] No se pudo registrar el service worker:', error)
      }
    })
  }, [])

  return null
}
