'use client'

import Link from 'next/link'
import { CoupleCashLogo } from '@/components/login/couple-cash-logo'
import { AccountAvatarLink } from './account-avatar-link'
import { NotificationInbox } from '@/components/notifications/notification-inbox'

export function AppHeader({
  firstName,
  email,
  avatarUrl,
}: {
  firstName: string
  email?: string | null
  avatarUrl?: string | null
}) {
  return (
    <header className="flex items-center justify-between py-2">
      <Link href="/" className="flex items-center gap-2">
        <CoupleCashLogo className="w-8 h-8" />
        <span className="text-[17px] font-bold text-[#2D3436] tracking-tight">
          CoupleCash
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <NotificationInbox />
        <AccountAvatarLink
          firstName={firstName}
          email={email}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  )
}
