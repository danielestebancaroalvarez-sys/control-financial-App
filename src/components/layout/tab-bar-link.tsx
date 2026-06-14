'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

function TabPendingDot() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span
      className="absolute -top-0.5 right-2 w-2 h-2 rounded-full bg-[#00BFA5] animate-pulse"
      aria-hidden
    />
  )
}

function CenterPendingRing({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return (
    <motion.div
      whileTap={{ scale: 0.92 }}
      className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/90 bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] ${
        pending ? 'shadow-[#00BFA5]/50' : 'shadow-[#00BFA5]/25'
      }`}
    >
      {pending && (
        <span className="absolute inset-0 rounded-full border-2 border-white/60 border-t-white animate-spin" />
      )}
      {children}
    </motion.div>
  )
}

export function TabBarLink({
  href,
  label,
  icon: Icon,
  active,
  showActiveDot,
  center,
  children,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  showActiveDot?: boolean
  center?: boolean
  children?: React.ReactNode
}) {
  if (center) {
    return (
      <Link
        href={href}
        prefetch
        className="relative -top-5 flex flex-col items-center shrink-0"
        aria-label={label}
      >
        <CenterPendingRing>
          {children}
        </CenterPendingRing>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      prefetch
      className="relative flex flex-col items-center gap-0.5 py-1.5 min-w-[3.25rem]"
    >
      {showActiveDot && (
        <motion.span
          layoutId="tab-active"
          className="absolute -top-0.5 w-1 h-1 rounded-full bg-[#00BFA5]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <TabPendingDot />
      <motion.div whileTap={{ scale: 0.88 }}>
        <Icon
          className={`w-6 h-6 transition-colors ${
            active ? 'text-[#00BFA5]' : 'text-cc-muted'
          }`}
          strokeWidth={active ? 2.5 : 2}
        />
      </motion.div>
      <span
        className={`text-[10px] font-semibold transition-colors ${
          active ? 'text-[#00BFA5]' : 'text-cc-muted'
        }`}
      >
        {label}
      </span>
    </Link>
  )
}
