'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  const initial = firstName.charAt(0).toUpperCase()

  return (
    <Link
      href="/ajustes"
      className={`flex items-center gap-2 rounded-full pl-3 pr-1 py-1 transition-all ${
        active ? 'bg-[#00BFA5]/10 ring-2 ring-[#00BFA5]/30' : 'hover:bg-white/60'
      }`}
      aria-label="Cuenta y ajustes"
      title={email ?? 'Cuenta y ajustes'}
    >
      <span className="text-[13px] font-semibold text-cc-primary">{firstName}</span>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={firstName}
          className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white/90"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white text-[12px] font-bold shrink-0 ring-2 ring-white/90">
          {initial}
        </div>
      )}
    </Link>
  )
}
