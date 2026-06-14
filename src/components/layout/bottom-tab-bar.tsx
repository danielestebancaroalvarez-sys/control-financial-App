'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  TabAddIcon,
  TabHomeIcon,
  TabRadarIcon,
  TabSavingsIcon,
  TabSearchIcon,
} from '@/components/brand/tab-icons'

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

const TABS = [
  {
    href: '/',
    label: 'Inicio',
    renderIcon: (active: boolean) => <TabHomeIcon active={active} />,
  },
  {
    href: '/buscar',
    label: 'Buscar',
    renderIcon: (active: boolean) => <TabSearchIcon active={active} />,
  },
  {
    href: '/nuevo',
    label: 'Añadir',
    center: true as const,
    renderIcon: (_active?: boolean) => <TabAddIcon />,
  },
  {
    href: '/ahorros',
    label: 'Ahorros',
    renderIcon: (active: boolean) => <TabSavingsIcon active={active} />,
  },
  {
    href: '/predicciones',
    label: 'Radar',
    renderIcon: (active: boolean) => <TabRadarIcon active={active} />,
  },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function BottomTabBar() {
  const pathname = usePathname()
  const activeIndex = TABS.findIndex(tab => isActive(pathname, tab.href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md px-4">
        <div className="relative flex items-end justify-around rounded-[28px] cc-surface shadow-[0_8px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)] px-2 py-2">
          {TABS.map((tab, index) => {
            const active = isActive(pathname, tab.href)

            if ('center' in tab && tab.center) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch
                  className="relative -top-5 flex flex-col items-center shrink-0"
                  aria-label={tab.label}
                >
                  <CenterPendingRing>{tab.renderIcon(false)}</CenterPendingRing>
                </Link>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch
                className="relative flex flex-col items-center gap-0.5 py-1.5 min-w-[3.25rem]"
              >
                {active && activeIndex === index && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute -top-0.5 w-1 h-1 rounded-full bg-[#00BFA5]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <TabPendingDot />
                <motion.div whileTap={{ scale: 0.88 }}>
                  {tab.renderIcon(active)}
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    active ? 'text-[#00BFA5]' : 'text-cc-muted'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
