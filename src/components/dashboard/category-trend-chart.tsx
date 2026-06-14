type Point = {
  label: string
  categories: { name: string; amount: number; color: string }[]
}

export function CategoryTrendChart({ data }: { data: Point[] }) {
  const legendNames = [
    ...new Set(data.flatMap(p => p.categories.map(c => c.name))),
  ]

  const maxTotal = Math.max(
    ...data.map(p => p.categories.reduce((s, c) => s + c.amount, 0)),
    1
  )
  const height = 140
  const chartH = height - 28
  const gap = Math.min(36, Math.max(22, 220 / Math.max(data.length, 1)))
  const width = data.length * gap + 24
  const barW = Math.min(20, gap - 8)

  if (data.every(p => p.categories.length === 0)) {
    return (
      <p className="text-[12px] text-cc-secondary text-center py-4">
        Sin gastos por categoría en este rango
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[140px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {[0.25, 0.5, 0.75, 1].map(t => {
          const y = 6 + chartH * (1 - t)
          return (
            <line
              key={t}
              x1={10}
              y1={y}
              x2={width - 10}
              y2={y}
              stroke="#EEEEEE"
              strokeWidth={1}
            />
          )
        })}
        {data.map((point, i) => {
          const x = 14 + i * gap
          const baseY = 6 + chartH
          let yOffset = 0
          const total = point.categories.reduce((s, c) => s + c.amount, 0)

          return (
            <g key={`${point.label}-${i}`}>
              {point.categories.map(cat => {
                const h = (cat.amount / maxTotal) * chartH
                const y = baseY - yOffset - h
                yOffset += h
                return (
                  <rect
                    key={cat.name}
                    x={x - barW / 2}
                    y={y}
                    width={barW}
                    height={Math.max(h, cat.amount > 0 ? 2 : 0)}
                    fill={cat.color}
                    rx={2}
                  >
                    <title>
                      {cat.name}: {cat.amount}
                    </title>
                  </rect>
                )
              })}
              {total <= 0 && (
                <rect
                  x={x - barW / 2}
                  y={baseY - 2}
                  width={barW}
                  height={2}
                  fill="#ECEFF1"
                  rx={1}
                />
              )}
              <text
                x={x}
                y={height - 6}
                textAnchor="middle"
                className="fill-[#B2BEC3] text-[8px] font-semibold"
              >
                {point.label}
              </text>
            </g>
          )
        })}
      </svg>
      {legendNames.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {legendNames.map(name => {
            const color =
              data
                .flatMap(p => p.categories)
                .find(c => c.name === name)?.color ?? '#636E72'
            return (
              <div key={name} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] text-cc-secondary font-medium">{name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
