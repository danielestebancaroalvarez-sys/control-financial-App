'use client'

import { useLayoutEffect } from 'react'

export type ThemePreference = 'light' | 'dark'

export function ApplyTheme({ theme }: { theme: ThemePreference }) {
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
  }, [theme])

  return null
}
