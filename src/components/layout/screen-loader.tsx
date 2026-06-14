import { CoupleCashMark } from '@/components/brand/couple-cash-mark'

export function ScreenLoader({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative" role="status" aria-label={label}>
        <CoupleCashMark className="w-12 h-12 animate-pulse" />
        <span className="absolute inset-0 rounded-full border-[3px] border-[#00BFA5]/20 border-t-[#00BFA5] animate-spin" />
      </div>
      <p className="text-[12px] font-medium text-[#636E72]">{label}</p>
    </div>
  )
}
