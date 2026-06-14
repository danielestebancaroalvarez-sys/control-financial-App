type Bar = { label: string; income: number; expenses: number }

export function TrendBarChart({ data }: { data: Bar[] }) {
  const max = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1)
  const height = 120
  const barW = 14
  const gap = 28
  const width = data.length * gap + 20
  const chartH = height - 24

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[120px]"
      preserveAspectRatio="xMidYMid meet"
    >
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = 8 + chartH * (1 - t)
        return (
          <line
            key={t}
            x1={8}
            y1={y}
            x2={width - 8}
            y2={y}
            stroke="#EEEEEE"
            strokeWidth={1}
          />
        )
      })}
      {data.map((point, i) => {
        const x = 16 + i * gap
        const incomeH = (point.income / max) * chartH
        const expenseH = (point.expenses / max) * chartH
        const baseY = 8 + chartH
        return (
          <g key={`${point.label}-${i}`}>
            <rect
              x={x - barW / 2 - 2}
              y={baseY - incomeH}
              width={barW}
              height={Math.max(incomeH, point.income > 0 ? 3 : 0)}
              rx={4}
              fill="url(#incomeGrad)"
            />
            <rect
              x={x - barW / 2 + barW + 2}
              y={baseY - expenseH}
              width={barW}
              height={Math.max(expenseH, point.expenses > 0 ? 3 : 0)}
              rx={4}
              fill="url(#expenseGrad)"
            />
            <text
              x={x + barW / 2}
              y={height - 4}
              textAnchor="middle"
              className="fill-[#B2BEC3] text-[8px] font-semibold"
            >
              {point.label}
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
  )
}
