'use client'

import { usePathname } from 'next/navigation'
import { AppModulePicker } from './app-module-picker'
import { NotificationInbox } from '@/components/notifications/notification-inbox'
import { AccountAvatarLink } from './account-avatar-link'
import { getAppModule } from '@/lib/app/module'

const HEADER_BORDER: Record<ReturnType<typeof getAppModule>, string> = {
  finance: 'border-b border-[#00BFA5]/10',
  time: 'border-b border-[#6366F1]/10',
  travel: 'border-b border-[#0EA5E9]/10',
}

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

  return (
    <header className={`py-2 mb-1 transition-colors ${HEADER_BORDER[module]}`}>
      <div className="flex items-center justify-between gap-3">
        <AppModulePicker />
        <div className="flex items-center gap-2 shrink-0">
          <NotificationInbox module={module} />
          <AccountAvatarLink
            firstName={firstName}
            email={email}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  )
}
