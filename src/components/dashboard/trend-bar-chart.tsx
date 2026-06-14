type Bar = { label: string; income: number; expenses: number }

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(Math.round(n))
}

export function TrendBarChart({ data }: { data: Bar[] }) {
  if (data.length === 0) {
    return (
      <p className="text-[12px] text-cc-secondary text-center py-6">Sin datos de tendencia</p>
    )
  }

  const max = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1)
  const height = 156
  const padL = 36
  const padR = 12
  const padT = 16
  const padB = 36
  const groupGap = 12
  const barW = 10
  const pairGap = 3
  const groupW = barW * 2 + pairGap
  const width = padL + padR + data.length * groupW + (data.length - 1) * groupGap
  const chartH = height - padT - padB
  const baseY = padT + chartH

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[156px]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Tendencia de ingresos y gastos"
      >
        {[0, 0.5, 1].map(t => {
          const y = padT + chartH * (1 - t)
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="#EEEEEE"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[#B2BEC3] text-[7px] font-semibold"
              >
                {formatCompact(max * t)}
              </text>
            </g>
          )
        })}

        {data.map((point, i) => {
          const groupX = padL + i * (groupW + groupGap)
          const incomeH = (point.income / max) * chartH
          const expenseH = (point.expenses / max) * chartH
          const balance = point.income - point.expenses
          const labelX = groupX + groupW / 2

          return (
            <g key={`${point.label}-${i}`}>
              <rect
                x={groupX}
                y={baseY - incomeH}
                width={barW}
                height={Math.max(incomeH, point.income > 0 ? 4 : 0)}
                rx={3}
                fill="url(#incomeGrad)"
              >
                <title>{`Ingresos: ${point.income}`}</title>
              </rect>
              <rect
                x={groupX + barW + pairGap}
                y={baseY - expenseH}
                width={barW}
                height={Math.max(expenseH, point.expenses > 0 ? 4 : 0)}
                rx={3}
                fill="url(#expenseGrad)"
              >
                <title>{`Gastos: ${point.expenses}`}</title>
              </rect>

              {point.income > 0 && incomeH >= 14 && (
                <text
                  x={groupX + barW / 2}
                  y={baseY - incomeH - 4}
                  textAnchor="middle"
                  className="fill-[#00BFA5] text-[6px] font-bold"
                >
                  {formatCompact(point.income)}
                </text>
              )}
              {point.expenses > 0 && expenseH >= 14 && (
                <text
                  x={groupX + barW + pairGap + barW / 2}
                  y={baseY - expenseH - 4}
                  textAnchor="middle"
                  className="fill-[#EC4899] text-[6px] font-bold"
                >
                  {formatCompact(point.expenses)}
                </text>
              )}

              <text
                x={labelX}
                y={height - 18}
                textAnchor="middle"
                className={`text-[8px] font-semibold ${
                  point.label === '•' ? 'fill-[#00BFA5]' : 'fill-[#636E72]'
                }`}
              >
                {point.label}
              </text>
              <text
                x={labelX}
                y={height - 6}
                textAnchor="middle"
                className={`text-[7px] font-bold ${
                  balance >= 0 ? 'fill-[#00BFA5]' : 'fill-[#EC4899]'
                }`}
              >
                {balance >= 0 ? '+' : ''}
                {formatCompact(balance)}
              </text>
            </g>
          )
        })}

        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#00BFA5" />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex justify-center gap-4 text-[10px] font-semibold text-cc-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#00BFA5]" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#EC4899]" />
          Gastos
        </span>
        <span className="text-cc-muted">+/− = balance del periodo</span>
      </div>
    </div>
  )
}
