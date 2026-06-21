'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/profile/user-avatar'
import { getAppModule } from '@/lib/app/module'

const SETTINGS_PATH: Record<ReturnType<typeof getAppModule>, string> = {
  finance: '/ajustes',
  time: '/tiempo/ajustes',
  travel: '/viajes/ajustes',
}

const ACCENT: Record<ReturnType<typeof getAppModule>, string> = {
  finance: '#00BFA5',
  time: '#6366F1',
  travel: '#0EA5E9',
}

export function AccountAvatarLink({
  firstName,
  email,
  avatarUrl,
}: {
  firstName: string
  email?: string | null
  avatarUrl?: string | null
}) {
  const pathname = usePathname()
  const module = getAppModule(pathname)
  const settingsHref = SETTINGS_PATH[module]
  const active =
    pathname.startsWith('/ajustes') ||
    pathname.startsWith('/tiempo/ajustes') ||
    pathname.startsWith('/viajes/ajustes')
  const accent = ACCENT[module]

  return (
    <Link
      href={settingsHref}
      className={`flex items-center gap-2 rounded-full pl-3 pr-1 py-1 transition-all ${
        active
          ? `ring-2`
          : 'hover:bg-white/60 dark:hover:bg-[var(--cc-surface-muted)]'
      }`}
      style={
        active
          ? {
              backgroundColor: `${accent}18`,
              boxShadow: `0 0 0 2px ${accent}40`,
            }
          : undefined
      }
      aria-label="Cuenta y ajustes"
    >
      <span className="text-[12px] font-semibold text-cc-primary hidden sm:inline max-w-[5rem] truncate">
        {firstName}
      </span>
      <UserAvatar name={firstName} avatarUrl={avatarUrl} size="sm" />
    </Link>
  )
}
