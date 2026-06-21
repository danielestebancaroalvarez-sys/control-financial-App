'use client'

import { formatMoney } from '@/lib/finance/format'
import type { MemberSpendingStat } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

const FALLBACK_COLORS = ['#EC4899', '#F59E0B', '#00BFA5', '#6366F1', '#81D4FA', '#A78BFA']

function memberColor(index: number) {
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export function MemberSpendingDetail({
  members,
  currency,
}: {
  members: MemberSpendingStat[]
  currency: CurrencyCode
  periodStart?: string
  periodEnd?: string
}) {
  const formatValue = (n: number) => formatMoney(n, currency)

  return (
    <div className="space-y-3 pt-2">
      <p className="text-[10px] text-cc-muted">
        Color intenso = gasto extra · tenue = planificado
      </p>

      {members.map((member, index) => {
        const accent = memberColor(index)

        return (
          <div
            key={member.userId}
            className="rounded-2xl border border-[var(--cc-border-subtle)] p-3"
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
                    {member.percent}% del total
                    {member.extraAmount > 0 && (
                      <>
                        {' '}
                        · {formatValue(member.extraAmount)} extra
                      </>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-cc-primary shrink-0">
                {formatValue(member.amount)}
              </span>
            </div>

            {member.byCategory.length > 0 && (
              <div className="h-2 rounded-full overflow-hidden flex bg-[var(--cc-track)]">
                {member.byCategory.map(cat => {
                  const extraRatio =
                    cat.amount > 0 ? (cat.extraAmount / cat.amount) * 100 : 0
                  const color = cat.color ?? accent

                  return (
                    <div
                      key={cat.categoryName}
                      title={`${cat.categoryName}: ${formatValue(cat.amount)} (${formatValue(cat.extraAmount)} extra)`}
                      className="h-full relative first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${cat.percent}%`,
                        minWidth: cat.percent > 0 ? '4px' : undefined,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: color, opacity: 0.28 }}
                      />
                      {extraRatio > 0 && (
                        <div
                          className="absolute inset-y-0 left-0"
                          style={{
                            width: `${extraRatio}%`,
                            backgroundColor: color,
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {member.extraAboveShare !== 0 && member.extraAmount > 0 && (
              <p className="text-[10px] text-cc-muted mt-1.5">
                {member.extraAboveShare > 0 ? (
                  <span className="text-[#EC4899] font-semibold">
                    +{formatValue(member.extraAboveShare)} extra sobre la media
                  </span>
                ) : (
                  <span className="text-[#00BFA5] font-semibold">
                    {formatValue(Math.abs(member.extraAboveShare))} bajo la media en extra
                  </span>
                )}
              </p>
            )}

            {member.byCategory.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
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
          </div>
        )
      })}
    </div>
  )
}
