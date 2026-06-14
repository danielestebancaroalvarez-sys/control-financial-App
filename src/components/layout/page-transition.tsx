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

  if (pathname === '/nuevo') {
    return <>{children}</>
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: direction * 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 32,
        mass: 0.8,
      }}
    >
      {children}
    </motion.div>
  )
}
