'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  Clock,
  ClipboardList,
  Plane,
  Plus,
  Search,
  Target,
  Wallet,
} from 'lucide-react'
import {
  TabAddIcon,
  TabHomeIcon,
  TabRadarIcon,
  TabSavingsIcon,
  TabSearchIcon,
} from '@/components/brand/tab-icons'
import { getAppModule } from '@/lib/app/module'

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

function CenterPendingRing({
  children,
  accent = 'finance',
}: {
  children: React.ReactNode
  accent?: 'finance' | 'time' | 'travel'
}) {
  const { pending } = useLinkStatus()
  const gradient =
    accent === 'travel'
      ? 'from-[#0EA5E9] to-[#38BDF8] shadow-[#0EA5E9]/25'
      : accent === 'time'
        ? 'from-[#6366F1] to-[#8B5CF6] shadow-[#6366F1]/25'
        : 'from-[#00BFA5] to-[#2DD4BF] shadow-[#00BFA5]/25'
  return (
    <motion.div
      whileTap={{ scale: 0.92 }}
      className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/90 bg-gradient-to-br ${gradient} ${
        pending && accent === 'travel' ? 'shadow-[#0EA5E9]/50' : ''
      } ${pending && accent === 'time' ? 'shadow-[#6366F1]/50' : ''} ${
        pending && accent === 'finance' ? 'shadow-[#00BFA5]/50' : ''
      }`}
    >
      {pending && (
        <span className="absolute inset-0 rounded-full border-2 border-white/60 border-t-white animate-spin" />
      )}
      {children}
    </motion.div>
  )
}

const FINANCE_TABS = [
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

const TIME_TABS = [
  {
    href: '/tiempo',
    label: 'Inicio',
    renderIcon: (active: boolean) => (
      <Clock className={`w-5 h-5 ${active ? 'text-[#6366F1]' : 'text-cc-muted'}`} />
    ),
  },
  {
    href: '/tiempo/buscar',
    label: 'Buscar',
    renderIcon: (active: boolean) => (
      <Search className={`w-5 h-5 ${active ? 'text-[#6366F1]' : 'text-cc-muted'}`} />
    ),
  },
  {
    href: '/tiempo/nuevo',
    label: 'Añadir',
    center: true as const,
    renderIcon: (_active?: boolean) => <Plus className="w-6 h-6 text-white" />,
  },
  {
    href: '/tiempo/horario',
    label: 'Horario',
    renderIcon: (active: boolean) => (
      <CalendarClock className={`w-5 h-5 ${active ? 'text-[#6366F1]' : 'text-cc-muted'}`} />
    ),
  },
  {
    href: '/tiempo/metas',
    label: 'Metas',
    renderIcon: (active: boolean) => (
      <Target className={`w-5 h-5 ${active ? 'text-[#6366F1]' : 'text-cc-muted'}`} />
    ),
  },
] as const

const TRAVEL_TABS = [
  {
    href: '/viajes',
    label: 'Inicio',
    renderIcon: (active: boolean) => (
      <Plane className={`w-5 h-5 ${active ? 'text-[#0EA5E9]' : 'text-cc-muted'}`} />
    ),
  },
  {
    href: '/viajes/buscar',
    label: 'Buscar',
    renderIcon: (active: boolean) => (
      <Search className={`w-5 h-5 ${active ? 'text-[#0EA5E9]' : 'text-cc-muted'}`} />
    ),
  },
  {
    href: '/viajes/nuevo',
    label: 'Añadir',
    center: true as const,
    renderIcon: (_active?: boolean) => <Plus className="w-6 h-6 text-white" />,
  },
  {
    href: '/viajes/presupuesto',
    label: 'Presupuesto',
    renderIcon: (active: boolean) => (
      <Wallet className={`w-5 h-5 ${active ? 'text-[#0EA5E9]' : 'text-cc-muted'}`} />
    ),
  },
  {
    href: '/viajes/preparacion',
    label: 'Preparación',
    renderIcon: (active: boolean) => (
      <ClipboardList className={`w-5 h-5 ${active ? 'text-[#0EA5E9]' : 'text-cc-muted'}`} />
    ),
  },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/' || href === '/tiempo' || href === '/viajes') {
    return pathname === href
  }
  return pathname.startsWith(href)
}

type TabItem =
  | (typeof FINANCE_TABS)[number]
  | (typeof TIME_TABS)[number]
  | (typeof TRAVEL_TABS)[number]

function TabBar({
  tabs,
  accent,
}: {
  tabs: readonly TabItem[]
  accent: 'finance' | 'time' | 'travel'
}) {
  const pathname = usePathname()
  const activeIndex = tabs.findIndex(tab => isActive(pathname, tab.href))
  const activeColor =
    accent === 'travel'
      ? 'text-[#0EA5E9]'
      : accent === 'time'
        ? 'text-[#6366F1]'
        : 'text-[#00BFA5]'
  const dotColor =
    accent === 'travel'
      ? 'bg-[#0EA5E9]'
      : accent === 'time'
        ? 'bg-[#6366F1]'
        : 'bg-[#00BFA5]'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md px-4">
        <div className="relative flex items-end justify-around rounded-[28px] cc-surface shadow-[0_8px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)] px-2 py-2">
          {tabs.map((tab, index) => {
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
                  <CenterPendingRing accent={accent}>
                    {tab.renderIcon(false)}
                  </CenterPendingRing>
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
                    layoutId={`tab-active-${accent}`}
                    className={`absolute -top-0.5 w-1 h-1 rounded-full ${dotColor}`}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <TabPendingDot />
                <motion.div whileTap={{ scale: 0.88 }}>
                  {tab.renderIcon(active)}
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    active ? activeColor : 'text-cc-muted'
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

export function BottomTabBar() {
  const pathname = usePathname()
  const module = getAppModule(pathname)

  if (module === 'travel') {
    return <TabBar tabs={TRAVEL_TABS} accent="travel" />
  }

  if (module === 'time') {
    return <TabBar tabs={TIME_TABS} accent="time" />
  }

  return <TabBar tabs={FINANCE_TABS} accent="finance" />
}
