'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CoupleCashLogo } from '@/components/login/couple-cash-logo'
import { AccountAvatarLink } from './account-avatar-link'
import { ModuleSwitcher } from './module-switcher'
import { NotificationInbox } from '@/components/notifications/notification-inbox'
import { getAppModule, moduleHomePath } from '@/lib/app/module'

export function AppHeader({
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
  const home = moduleHomePath(module)

  return (
    <header className="py-2">
      <div className="flex items-center justify-between">
        <Link href={home} className="flex items-center gap-2">
          <CoupleCashLogo className="w-8 h-8" />
          <span className="text-[17px] font-bold text-cc-primary tracking-tight">
            Couple Hub
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
      </div>
      <ModuleSwitcher />
    </header>
  )
}
