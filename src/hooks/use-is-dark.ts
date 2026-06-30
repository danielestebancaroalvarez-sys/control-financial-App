'use client'

import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  const root = document.documentElement
  const observer = new MutationObserver(onChange)
  observer.observe(root, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark')
}

export function useIsDark() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
