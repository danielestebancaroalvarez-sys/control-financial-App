import { CoupleCashLogo } from '@/components/login/couple-cash-logo'

export function AppHeader({
  displayName,
  email,
}: {
  displayName: string
  email?: string | null
}) {
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="flex items-center justify-between px-1 py-4">
      <div className="flex items-center gap-2">
        <CoupleCashLogo className="w-9 h-9" />
        <span className="text-[18px] font-bold text-[#2D3436] tracking-tight">
          CoupleCash
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right hidden xs:block">
          <p className="text-[11px] text-[#636E72]">Hola,</p>
          <p className="text-[13px] font-semibold text-[#2D3436] leading-tight">
            {displayName}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#2DD4BF] flex items-center justify-center text-white text-[13px] font-bold shrink-0"
          title={email ?? undefined}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}
