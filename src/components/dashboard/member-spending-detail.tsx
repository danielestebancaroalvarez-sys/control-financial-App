'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink } from 'lucide-react'
import type { MemberSpendingStat } from '@/lib/finance/types'

const FALLBACK_COLORS = ['#EC4899', '#F59E0B', '#00BFA5', '#6366F1', '#81D4FA', '#A78BFA']

function memberColor(index: number) {
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export function MemberSpendingDetail({
  members,
  formatValue,
  periodStart,
  periodEnd,
}: {
  members: MemberSpendingStat[]
  formatValue: (n: number) => string
  periodStart: string
  periodEnd: string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    members.length === 1 ? members[0].userId : null
  )

  return (
    <div className="space-y-3 pt-2">
      {members.map((member, index) => {
        const isOpen = expandedId === member.userId
        const accent = memberColor(index)

        return (
          <div
            key={member.userId}
            className="rounded-2xl border border-[var(--cc-border-subtle)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : member.userId)}
              className="w-full p-3 text-left hover:bg-[var(--cc-surface-muted)] transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span
                      className="w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-cc-primary truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-cc-muted">
                      {member.percent}% del total extra
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[13px] font-bold text-cc-primary">
                    {formatValue(member.amount)}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-cc-muted transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {member.byCategory.length > 0 && (
                <div className="h-2 rounded-full overflow-hidden flex bg-[var(--cc-track)]">
                  {member.byCategory.map(cat => (
                    <div
                      key={cat.categoryName}
                      title={`${cat.categoryName}: ${formatValue(cat.amount)}`}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: cat.color ?? accent,
                        minWidth: cat.percent > 0 ? '4px' : undefined,
                      }}
                    />
                  ))}
                </div>
              )}

              {member.extraAboveShare !== 0 && (
                <p className="text-[10px] text-cc-muted mt-1.5">
                  {member.extraAboveShare > 0 ? (
                    <span className="text-[#EC4899] font-semibold">
                      +{formatValue(member.extraAboveShare)} sobre la media
                    </span>
                  ) : (
                    <span className="text-[#00BFA5] font-semibold">
                      {formatValue(Math.abs(member.extraAboveShare))} bajo la media
                    </span>
                  )}
                </p>
              )}
            </button>

            {isOpen && (
              <div className="px-3 pb-3 border-t border-[var(--cc-border-subtle)] bg-[var(--cc-surface-muted)]/40">
                {member.byCategory.length > 0 && (
                  <div className="pt-3 pb-2 flex flex-wrap gap-x-3 gap-y-1">
                    {member.byCategory.map(cat => (
                      <span
                        key={cat.categoryName}
                        className="text-[10px] text-cc-secondary flex items-center gap-1"
                      >
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: cat.color ?? accent }}
                        />
                        {cat.categoryName}{' '}
                        <span className="font-semibold text-cc-primary">
                          {formatValue(cat.amount)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {member.transactions.map(tx => (
                    <li
                      key={tx.id}
                      className="flex items-start justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-cc-primary truncate">
                          {tx.description}
                        </p>
                        <p className="text-cc-muted">
                          {tx.categoryName} · {tx.date}
                        </p>
                      </div>
                      <span className="font-bold text-cc-primary shrink-0">
                        {formatValue(tx.amount)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/buscar?from=${periodStart}&to=${periodEnd}&member=${member.userId}`}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#00BFA5]"
                >
                  Ver en buscar
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
