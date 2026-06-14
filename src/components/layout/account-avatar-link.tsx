'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AccountAvatarLink({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string
  email?: string | null
  avatarUrl?: string | null
}) {
  const pathname = usePathname()
  const active = pathname.startsWith('/ajustes')
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <Link
      href="/ajustes"
      className={`flex items-center gap-2.5 rounded-2xl py-1 pl-2 pr-1 transition-all ${
        active
          ? 'bg-[#00BFA5]/10 ring-2 ring-[#00BFA5]/40'
          : 'hover:bg-white/50'
      }`}
      aria-label="Cuenta y ajustes"
      title={email ?? 'Cuenta y ajustes'}
    >
      <div className="text-right leading-tight">
        <p className="text-[10px] text-[#636E72]">Hola,</p>
        <p className="text-[13px] font-semibold text-[#2D3436] max-w-[7rem] truncate">
          {displayName}
        </p>
      </div>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName}
          className={`w-9 h-9 rounded-full object-cover shrink-0 ${
            active ? 'ring-2 ring-[#00BFA5]' : 'ring-2 ring-white/80'
          }`}
        />
      ) : (
        <div
          className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white text-[13px] font-bold shrink-0 ${
            active ? 'ring-2 ring-[#00BFA5]' : 'ring-2 ring-white/80'
          }`}
        >
          {initial}
        </div>
      )}
    </Link>
  )
}
