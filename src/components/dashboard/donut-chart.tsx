type Slice = { value: number; color: string; label: string }

export function DonutChart({
  slices,
  size = 160,
  stroke = 22,
  centerLabel,
  centerValue,
}: {
  slices: Slice[]
  size?: number
  stroke?: number
  centerLabel?: string
  centerValue?: string
}) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2
  const trackStroke = 'var(--cc-track)'

  if (total <= 0) {
    return (
      <svg width={size} height={size} className="mx-auto">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackStroke}
          strokeWidth={stroke}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--cc-text-muted)] text-[11px] font-semibold"
        >
          Sin datos
        </text>
      </svg>
    )
  }

  let offset = 0

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="drop-shadow-sm">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackStroke}
          strokeWidth={stroke}
        />
        {slices.map(slice => {
          const pct = slice.value / total
          const dash = pct * circumference
          const gap = circumference - dash
          const rotation = (offset / total) * 360 - 90
          offset += slice.value
          return (
            <circle
              key={slice.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${cx} ${cy})`}
            />
          )
        })}
        {(centerLabel || centerValue) && (
          <>
            {centerValue && (
              <text
                x={cx}
                y={cy - (centerLabel ? 4 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[var(--cc-text-primary)] text-[13px] font-bold"
              >
                {centerValue}
              </text>
            )}
            {centerLabel && (
              <text
                x={cx}
                y={cy + (centerValue ? 12 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[var(--cc-text-secondary)] text-[9px] font-semibold"
              >
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {slices.map(slice => (
          <div key={slice.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-[11px] text-cc-secondary">{slice.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
