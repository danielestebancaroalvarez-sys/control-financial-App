'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { getTabDirection } from './tab-routes'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPath = useRef(pathname)

  const direction = getTabDirection(prevPath.current, pathname)

  useEffect(() => {
    prevPath.current = pathname
  }, [pathname])

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: direction * 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
