import { projectCompoundGrowth } from '@/lib/finance/savings'
import type { SavingsGoalInput } from '@/lib/finance/types'

type Props = {
  goal: SavingsGoalInput
  accentColor?: string
  height?: number
}

export function SavingsProjectionChart({
  goal,
  accentColor = '#F59E0B',
  height = 140,
}: Props) {
  const target = Number(goal.target_amount) || 0
  const current = Number(goal.current_amount) || 0

  if (target <= 0) {
    return (
      <p className="text-[12px] text-[#636E72] text-center py-6">
        Ingresa un monto objetivo para ver la simulación
      </p>
    )
  }

  const points = projectCompoundGrowth(goal, 60)
  if (points.length < 2) {
    return (
      <p className="text-[12px] text-[#636E72] text-center py-6">
        Agrega un aporte periódico para simular el crecimiento
      </p>
    )
  }

  const maxY = Math.max(target, ...points.map(p => p.balance), 1)
  const width = 280
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28
  const chartW = width - padL - padR
  const chartH = height - padT - padB

  const coords = points.map((p, i) => ({
    x: padL + (i / Math.max(points.length - 1, 1)) * chartW,
    y: padT + chartH - (p.balance / maxY) * chartH,
    balance: p.balance,
    month: p.month,
  }))

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${coords.at(-1)!.x} ${padT + chartH} L ${coords[0].x} ${padT + chartH} Z`

  const targetY = padT + chartH - (target / maxY) * chartH
  const reached = points.some(p => p.balance >= target)
  const reachMonth = points.find(p => p.balance >= target)?.month

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Simulación de crecimiento del ahorro"
      >
        {[0, 0.5, 1].map(t => {
          const y = padT + chartH * (1 - t)
          return (
            <line
              key={t}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="#EEEEEE"
              strokeWidth={1}
            />
          )
        })}

        <line
          x1={padL}
          y1={targetY}
          x2={width - padR}
          y2={targetY}
          stroke={accentColor}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.7}
        />

        <path d={areaPath} fill={accentColor} opacity={0.15} />
        <path
          d={linePath}
          fill="none"
          stroke={accentColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) =>
          i === 0 || i === coords.length - 1 || (reached && c.month === reachMonth) ? (
            <circle
              key={c.month}
              cx={c.x}
              cy={c.y}
              r={reached && c.month === reachMonth ? 4 : 3}
              fill={reached && c.month === reachMonth ? accentColor : '#fff'}
              stroke={accentColor}
              strokeWidth={2}
            />
          ) : null
        )}

        <text
          x={padL - 4}
          y={padT + 4}
          textAnchor="end"
          className="fill-[#B2BEC3] text-[7px] font-semibold"
        >
          {Math.round(maxY / 1000)}k
        </text>
        <text
          x={padL}
          y={height - 6}
          className="fill-[#B2BEC3] text-[8px] font-semibold"
        >
          Hoy
        </text>
        <text
          x={width - padR}
          y={height - 6}
          textAnchor="end"
          className="fill-[#B2BEC3] text-[8px] font-semibold"
        >
          {points.at(-1)!.month}m
        </text>
      </svg>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[#636E72]">
          Meta:{' '}
          <span className="font-bold" style={{ color: accentColor }}>
            {target.toLocaleString('es')}
          </span>
        </span>
        {reached && reachMonth !== undefined ? (
          <span className="font-semibold text-[#00BFA5]">
            Meta en ~{reachMonth} mes{reachMonth === 1 ? '' : 'es'}
          </span>
        ) : (
          <span className="text-[#636E72]">Proyección a 5 años</span>
        )}
      </div>
    </div>
  )
}

export function formToSavingsGoalInput(form: {
  target: string
  current: string
  contribution: string
  contributionFrequency: 'weekly' | 'biweekly' | 'monthly'
  mode: 'static' | 'compound'
  rate: string
  targetDate: string
}): SavingsGoalInput {
  return {
    target_amount: parseFloat(form.target) || 0,
    current_amount: parseFloat(form.current) || 0,
    contribution_amount: form.contribution ? parseFloat(form.contribution) : null,
    contribution_frequency: form.contribution ? form.contributionFrequency : null,
    savings_mode: form.mode,
    annual_interest_rate:
      form.mode === 'compound' && form.rate ? parseFloat(form.rate) / 100 : null,
    target_date: form.targetDate || null,
  }
}
