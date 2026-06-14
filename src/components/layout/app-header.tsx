import Link from 'next/link'
import { CoupleCashLogo } from '@/components/login/couple-cash-logo'
import { AccountAvatarLink } from './account-avatar-link'

export function AppHeader({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string
  email?: string | null
  avatarUrl?: string | null
}) {
  return (
    <header className="flex items-center justify-between px-1 py-3">
      <Link href="/" className="flex items-center gap-2.5">
        <CoupleCashLogo className="w-9 h-9" />
        <span className="text-[18px] font-bold text-[#2D3436] tracking-tight">
          CoupleCash
        </span>
      </Link>
      <AccountAvatarLink
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
      />
    </header>
  )
}
