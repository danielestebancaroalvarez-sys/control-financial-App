import Link from 'next/link'
import { listPeriodBlocks } from '@/lib/finance/format'
import type { Period } from '@/lib/finance/types'

export function PeriodBlockSelector({
  period,
  activeOffset,
  maxOffset = 0,
}: {
  period: Period
  activeOffset: number
  maxOffset?: number
}) {
  const blocks = listPeriodBlocks(period, maxOffset)

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {blocks.map(block => {
        const active = block.offset === activeOffset
        const href = block.offset === 0 ? '/' : `/?block=${block.offset}`
        return (
          <Link
            key={block.offset}
            href={href}
            prefetch
            className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              active
                ? 'bg-gradient-to-r from-[#00BFA5] to-[#2DD4BF] text-white shadow-sm'
                : 'bg-white/80 text-cc-secondary border border-white/60 hover:bg-white'
            }`}
          >
            {block.label}
          </Link>
        )
      })}
    </div>
  )
}
