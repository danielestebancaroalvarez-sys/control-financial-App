'use client'

import { usePathname } from 'next/navigation'
import { AppModulePicker } from './app-module-picker'
import { NotificationInbox } from '@/components/notifications/notification-inbox'
import { AccountAvatarLink } from './account-avatar-link'
import { getAppModule } from '@/lib/app/module'

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
  const isTime = module === 'time'

  return (
    <header
      className={`py-2 mb-1 transition-colors ${
        isTime ? 'border-b border-[#6366F1]/10' : 'border-b border-[#00BFA5]/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <AppModulePicker />
        {!isTime && (
          <div className="flex items-center gap-2 shrink-0">
            <NotificationInbox />
            <AccountAvatarLink
              firstName={firstName}
              email={email}
              avatarUrl={avatarUrl}
            />
          </div>
        )}
      </div>
    </header>
  )
}
