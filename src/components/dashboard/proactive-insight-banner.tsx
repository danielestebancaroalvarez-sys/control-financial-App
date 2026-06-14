'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { ProactiveInsight } from '@/lib/insights/proactive-insight'

const TONE_STYLES = {
  info: 'bg-[#E0F7FA] border-[#80DEEA] text-[#00695C]',
  warning: 'bg-[#FFF3E0] border-[#FFCC80] text-[#E65100]',
  positive: 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]',
} as const

export function ProactiveInsightBanner({ insight }: { insight: ProactiveInsight }) {
  const styles = TONE_STYLES[insight.tone]

  const content = (
    <div
      className={`rounded-2xl border p-3 flex items-start gap-2.5 ${styles} dark:opacity-95`}
    >
      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-[12px] font-semibold leading-snug flex-1">{insight.message}</p>
      {insight.href && (
        <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
      )}
    </div>
  )

  if (insight.href) {
    return (
      <Link href={insight.href} className="block active:opacity-80">
        {content}
      </Link>
    )
  }

  return content
}
