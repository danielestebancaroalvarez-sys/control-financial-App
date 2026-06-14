'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import type { WeeklyInsight } from '@/lib/finance/types'

export function WeeklyInsightsCard({ householdId }: { householdId: string }) {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(refresh = false) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/insights/weekly?householdId=${householdId}${refresh ? '&refresh=1' : ''}`
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudieron cargar los insights.')
        return
      }
      setInsight(data.insight as WeeklyInsight)
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [householdId])

  if (loading) {
    return (
      <section className="rounded-[24px] bg-gradient-to-br from-[#E0F2F1] to-white border border-[#00BFA5]/20 shadow-sm p-5">
        <div className="flex items-center gap-2 text-[#636E72]">
          <Loader2 className="w-4 h-4 animate-spin text-[#00BFA5]" />
          <span className="text-[13px]">Generando resumen de la semana...</span>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-[24px] bg-white/90 border border-white/60 shadow-sm p-5">
        <p className="text-[13px] text-[#636E72]">{error}</p>
        {!error.includes('GEMINI') && (
          <button
            type="button"
            onClick={() => load(true)}
            className="mt-2 text-[12px] font-semibold text-[#00BFA5]"
          >
            Reintentar
          </button>
        )}
      </section>
    )
  }

  if (!insight) return null

  return (
    <section className="rounded-[24px] bg-gradient-to-br from-[#E0F2F1] to-white border border-[#00BFA5]/20 shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00BFA5]" />
          <h2 className="text-[14px] font-bold text-[#2D3436]">Resumen de la semana</h2>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-[#636E72] hover:text-[#00BFA5]"
          aria-label="Actualizar insights"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {insight.summary && (
        <p className="text-[13px] text-[#2D3436] leading-relaxed">{insight.summary}</p>
      )}

      {insight.tips.length > 0 && (
        <ul className="space-y-2">
          {insight.tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12px] text-[#636E72] bg-white/60 rounded-xl px-3 py-2"
            >
              <span className="text-[#00BFA5] font-bold shrink-0">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
