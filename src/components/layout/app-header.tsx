import { CoupleCashLogo } from '@/components/login/couple-cash-logo'

export function AppHeader({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string
  email?: string | null
  avatarUrl?: string | null
}) {
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="flex items-center justify-between px-1 py-3">
      <div className="flex items-center gap-2.5">
        <CoupleCashLogo className="w-9 h-9" />
        <span className="text-[18px] font-bold text-[#2D3436] tracking-tight">
          CoupleCash
        </span>
      </div>
      <div className="flex items-center gap-2.5">
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
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/80 shrink-0"
            title={email ?? undefined}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white text-[13px] font-bold shrink-0 ring-2 ring-white/80"
            title={email ?? undefined}
          >
            {initial}
          </div>
        )}
      </div>
    </header>
  )
}
