'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/profile/user-avatar'

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
  const active = pathname.startsWith('/ajustes')

  return (
    <Link
      href="/ajustes"
      className={`flex items-center gap-2 rounded-full pl-3 pr-1 py-1 transition-all ${
        active ? 'bg-[#00BFA5]/10 ring-2 ring-[#00BFA5]/30' : 'hover:bg-white/60 dark:hover:bg-[var(--cc-surface-muted)]'
      }`}
      aria-label="Cuenta y ajustes"
      title={email ?? 'Cuenta y ajustes'}
    >
      <span className="text-[13px] font-semibold text-cc-primary">{firstName}</span>
      <UserAvatar name={firstName} avatarUrl={avatarUrl} size="sm" />
    </Link>
  )
}
