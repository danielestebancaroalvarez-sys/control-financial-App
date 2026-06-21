'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/profile/user-avatar'
import { getAppModule } from '@/lib/app/module'

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
  const isTime = getAppModule(pathname) === 'time'
  const settingsHref = isTime ? '/tiempo/ajustes' : '/ajustes'
  const active =
    pathname.startsWith('/ajustes') || pathname.startsWith('/tiempo/ajustes')
  const accent = isTime ? '#6366F1' : '#00BFA5'

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
      title={email ?? 'Cuenta y ajustes'}
    >
      <span className="text-[13px] font-semibold text-cc-primary">{firstName}</span>
      <UserAvatar name={firstName} avatarUrl={avatarUrl} size="sm" />
    </Link>
  )
}
