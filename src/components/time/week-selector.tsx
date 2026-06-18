import Link from 'next/link'
import { getWeekSelectorLabel } from '@/lib/time/format'

export function WeekSelector({
  activeOffset,
  basePath,
  count = 6,
}: {
  activeOffset: number
  basePath: string
  count?: number
}) {
  const blocks = Array.from({ length: count }, (_, offset) => ({
    offset,
    label: getWeekSelectorLabel(offset),
    href: offset === 0 ? basePath : `${basePath}?block=${offset}`,
  }))

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {blocks.map(block => {
        const active = block.offset === activeOffset
        return (
          <Link
            key={block.offset}
            href={block.href}
            prefetch
            title={block.label}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              active
                ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm'
                : 'bg-white/80 text-cc-secondary border border-white/60 dark:bg-[var(--cc-surface-muted)]'
            }`}
          >
            {block.label}
          </Link>
        )
      })}
    </div>
  )
}
