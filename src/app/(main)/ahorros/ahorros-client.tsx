'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, TrendingUp } from 'lucide-react'
import { createSavingsGoal } from '@/lib/finance/actions'
import { formatMoney } from '@/lib/finance/format'
import { projectCompoundGrowth } from '@/lib/finance/savings'
import type { SavingsGoal } from '@/lib/finance/types'
import type { CurrencyCode } from '@/lib/household/types'

function ProjectionChart({
  points,
  target,
  currency,
}: {
  points: { month: number; balance: number }[]
  target: number
  currency: CurrencyCode
}) {
  if (points.length < 2) return null

  const maxY = Math.max(target, ...points.map(p => p.balance))
  const w = 280
  const h = 100
  const pad = 8

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2)
    const y = h - pad - (p.balance / maxY) * (h - pad * 2)
    return `${x},${y}`
  })

  const areaCoords = [
    `${pad},${h - pad}`,
    ...coords,
    `${pad + ((points.length - 1) / (points.length - 1)) * (w - pad * 2)},${h - pad}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00BFA5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00BFA5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaCoords} fill="url(#chartGrad)" />
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="#00BFA5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1={pad}
        y1={h - pad - (target / maxY) * (h - pad * 2)}
        x2={w - pad}
        y2={h - pad - (target / maxY) * (h - pad * 2)}
        stroke="#F59E0B"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    </svg>
  )
}

export function AhorrosClient({
  goals: initialGoals,
  householdId,
  currency,
}: {
  goals: SavingsGoal[]
  householdId: string
  currency: CurrencyCode
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialGoals[0]?.id ?? null
  )

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('0')
  const [contribution, setContribution] = useState('')
  const [mode, setMode] = useState<'static' | 'compound'>('static')
  const [rate, setRate] = useState('')

  const fmt = (n: number) => formatMoney(n, currency)
  const selected = initialGoals.find(g => g.id === selectedId)

  const projection = selected
    ? projectCompoundGrowth({
        target_amount: selected.target_amount,
        current_amount: selected.current_amount,
        contribution_amount: selected.contribution_amount,
        contribution_frequency: selected.contribution_frequency,
        savings_mode: selected.savings_mode,
        annual_interest_rate: selected.annual_interest_rate,
        target_date: selected.target_date,
      })
    : []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createSavingsGoal({
      householdId,
      name: name.trim(),
      targetAmount: parseFloat(target),
      currentAmount: parseFloat(current) || 0,
      contributionAmount: contribution ? parseFloat(contribution) : undefined,
      contributionFrequency: contribution ? 'monthly' : undefined,
      savingsMode: mode,
      annualInterestRate: rate ? parseFloat(rate) / 100 : undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#2D3436]">Ahorros</h1>
          <p className="text-[13px] text-[#636E72]">Metas y proyección de riqueza</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="w-10 h-10 rounded-full bg-[#00BFA5] text-white flex items-center justify-center shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5 space-y-3"
        >
          <h2 className="text-[15px] font-bold text-[#2D3436]">Nueva meta</h2>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre de la meta"
            required
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="Meta ($)"
              required
              min="1"
              className="px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
            <input
              type="number"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="Actual ($)"
              min="0"
              className="px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          </div>
          <input
            type="number"
            value={contribution}
            onChange={e => setContribution(e.target.value)}
            placeholder="Aporte mensual (opcional)"
            min="0"
            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
          />
          <div className="flex gap-2">
            {(['static', 'compound'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold ${
                  mode === m
                    ? 'bg-[#00BFA5] text-white'
                    : 'bg-[#F5F5F5] text-[#636E72]'
                }`}
              >
                {m === 'static' ? 'Quieto' : 'Con rentabilidad'}
              </button>
            ))}
          </div>
          {mode === 'compound' && (
            <input
              type="number"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder="Tasa anual % (ej. 5)"
              step="0.1"
              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F5] text-[14px] outline-none"
            />
          )}
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00BFA5] text-white font-bold text-[14px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear meta'}
          </button>
        </form>
      )}

      {initialGoals.length === 0 ? (
        <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 p-8 text-center">
          <p className="text-[14px] text-[#636E72]">
            Crea tu primera meta de ahorro con el botón +
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {initialGoals.map(goal => {
              const pct = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100)
              )
              const active = selectedId === goal.id
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedId(goal.id)}
                  className={`w-full rounded-[24px] backdrop-blur-md border shadow-sm p-5 text-left transition-all ${
                    active
                      ? 'bg-white/95 border-[#00BFA5]/40 ring-2 ring-[#00BFA5]/20'
                      : 'bg-white/90 border-white/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[16px] font-bold text-[#2D3436]">{goal.name}</p>
                      {goal.target_date && (
                        <p className="text-[11px] text-[#636E72]">
                          Objetivo: {goal.target_date}
                        </p>
                      )}
                    </div>
                    <span className="text-[18px] font-bold text-[#F59E0B]">{pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F5F5F5] overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[12px] text-[#636E72]">
                    {fmt(goal.current_amount)} de {fmt(goal.target_amount)}
                    {goal.savings_mode === 'compound' && (
                      <span className="ml-2 text-[#00BFA5] font-semibold">
                        · Con interés
                      </span>
                    )}
                  </p>
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="rounded-[24px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#00BFA5]" />
                <h3 className="text-[14px] font-bold text-[#2D3436]">
                  Proyección — {selected.name}
                </h3>
              </div>
              <ProjectionChart
                points={projection}
                target={selected.target_amount}
                currency={currency}
              />
              <p className="text-[11px] text-[#636E72] mt-2 text-center">
                Línea punteada = meta ·{' '}
                {projection.length > 1
                  ? `~${projection.length - 1} meses estimados`
                  : 'Sin aporte definido'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
