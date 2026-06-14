'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Sparkles, Info } from 'lucide-react'
import type { InsightHighlight, WeeklyInsight } from '@/lib/finance/types'

const TONE_STYLES: Record<
  NonNullable<InsightHighlight['tone']>,
  string
> = {
  positive: 'bg-[#E0F2F1] text-[#00796B] dark:bg-[#1a3330] dark:text-[#4db6ac]',
  negative: 'bg-[#FCE4EC] text-[#C2185B] dark:bg-[#3a2830] dark:text-[#f48fb1]',
  warning: 'bg-[#FFF8E1] text-[#F57F17] dark:bg-[#3a3220] dark:text-[#ffb74d]',
  neutral: 'cc-chip-neutral',
}

export function WeeklyInsightsCard({ householdId }: { householdId: string }) {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [highlights, setHighlights] = useState<InsightHighlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBasis, setShowBasis] = useState(false)

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
      setHighlights(Array.isArray(data.highlights) ? data.highlights : [])
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
      <section className="cc-insight-card rounded-[24px] p-5">
        <div className="flex items-center gap-2 text-cc-secondary">
          <Loader2 className="w-4 h-4 animate-spin text-[#00BFA5]" />
          <span className="text-[13px]">Analizando tu mes...</span>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="cc-surface rounded-[24px] p-5">
        <p className="text-[13px] text-cc-secondary">{error}</p>
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
    <section className="cc-insight-card rounded-[24px] p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00BFA5]" />
            <h2 className="text-[14px] font-bold text-cc-primary">Resumen del mes</h2>
          </div>
          <p className="text-[10px] text-cc-secondary mt-0.5">
            Basado en ingresos, gastos, ahorros, mercado y pagos recurrentes
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          className="w-8 h-8 rounded-lg cc-surface-muted flex items-center justify-center text-cc-secondary hover:text-[#00BFA5]"
          aria-label="Actualizar insights"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {highlights.slice(0, 4).map(h => (
            <span
              key={h.label}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                TONE_STYLES[h.tone ?? 'neutral']
              }`}
            >
              <span className="opacity-70">{h.label}:</span>
              {h.value}
            </span>
          ))}
        </div>
      )}

      {insight.summary && (
        <p className="text-[13px] text-cc-primary leading-relaxed">{insight.summary}</p>
      )}

      {insight.tips.length > 0 && (
        <ul className="space-y-2">
          {insight.tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12px] text-cc-secondary cc-surface-muted rounded-xl px-3 py-2"
            >
              <span className="w-5 h-5 rounded-full bg-[#00BFA5] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      )}

      {highlights.length > 4 && (
        <>
          <button
            type="button"
            onClick={() => setShowBasis(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00BFA5]"
          >
            <Info className="w-3.5 h-3.5" />
            {showBasis ? 'Ocultar datos analizados' : 'Ver todos los datos analizados'}
          </button>
          {showBasis && (
            <div className="grid grid-cols-2 gap-1.5">
              {highlights.map(h => (
                <div
                  key={`full-${h.label}`}
                  className="px-2.5 py-2 rounded-xl cc-surface-muted text-[10px]"
                >
                  <p className="text-cc-muted font-medium">{h.label}</p>
                  <p className="font-bold text-cc-primary mt-0.5">{h.value}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
