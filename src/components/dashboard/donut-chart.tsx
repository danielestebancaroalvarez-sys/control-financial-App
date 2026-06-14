type Slice = { value: number; color: string; label: string }

export function DonutChart({
  slices,
  size = 160,
  stroke = 22,
}: {
  slices: Slice[]
  size?: number
  stroke?: number
}) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  if (total <= 0) {
    return (
      <svg width={size} height={size} className="mx-auto">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#ECEFF1"
          strokeWidth={stroke}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[#B2BEC3] text-[11px] font-semibold"
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
          stroke="#F5F5F5"
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
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {slices.map(slice => (
          <div key={slice.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-[11px] text-[#636E72]">{slice.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
