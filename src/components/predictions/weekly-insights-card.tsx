'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Sparkles, Info } from 'lucide-react'
import type { InsightHighlight, Period, WeeklyInsight } from '@/lib/finance/types'
import { getPeriodLabels } from '@/lib/finance/format'

const storageKey = (householdId: string, period: Period) =>
  `cc-weekly-insight:${householdId}:${period}`

type StoredInsight = {
  insight: WeeklyInsight
  highlights: InsightHighlight[]
  dataFingerprint: string
}

function readStoredInsight(
  householdId: string,
  period: Period
): StoredInsight | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(storageKey(householdId, period))
    if (!raw) return null
    return JSON.parse(raw) as StoredInsight
  } catch {
    return null
  }
}

function writeStoredInsight(
  householdId: string,
  period: Period,
  data: StoredInsight
) {
  try {
    sessionStorage.setItem(storageKey(householdId, period), JSON.stringify(data))
  } catch {
    // quota or private mode
  }
}

const TONE_STYLES: Record<
  NonNullable<InsightHighlight['tone']>,
  string
> = {
  positive: 'bg-[#E0F2F1] text-[#00796B] dark:bg-[#1a3330] dark:text-[#4db6ac]',
  negative: 'bg-[#FCE4EC] text-[#C2185B] dark:bg-[#3a2830] dark:text-[#f48fb1]',
  warning: 'bg-[#FFF8E1] text-[#F57F17] dark:bg-[#3a3220] dark:text-[#ffb74d]',
  neutral: 'cc-chip-neutral',
}

export function WeeklyInsightsCard({
  householdId,
  period,
}: {
  householdId: string
  period: Period
}) {
  const labels = getPeriodLabels(period)
  const stored = readStoredInsight(householdId, period)
  const [insight, setInsight] = useState<WeeklyInsight | null>(stored?.insight ?? null)
  const [highlights, setHighlights] = useState<InsightHighlight[]>(
    stored?.highlights ?? []
  )
  const [loading, setLoading] = useState(!stored)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBasis, setShowBasis] = useState(false)
  const [upToDate, setUpToDate] = useState(false)

  async function load(refresh = false) {
    if (refresh) setRefreshing(true)
    else if (!insight) setLoading(true)
    setError(null)
    setUpToDate(false)
    try {
      const res = await fetch(
        `/api/insights/weekly?householdId=${householdId}${refresh ? '&refresh=1' : ''}`
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudieron cargar los insights.')
        return
      }
      const nextInsight = data.insight as WeeklyInsight
      const nextHighlights = Array.isArray(data.highlights) ? data.highlights : []
      setInsight(nextInsight)
      setHighlights(nextHighlights)
      if (data.upToDate) setUpToDate(true)

      if (data.dataFingerprint) {
        writeStoredInsight(householdId, period, {
          insight: nextInsight,
          highlights: nextHighlights,
          dataFingerprint: data.dataFingerprint,
        })
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [householdId, period])

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
            <h2 className="text-[14px] font-bold text-cc-primary">
              Resumen {labels.ofPeriod}
            </h2>
          </div>
          <p className="text-[10px] text-cc-secondary mt-0.5">
            Basado en ingresos, gastos, ahorros, mercado y pagos recurrentes
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg cc-surface-muted flex items-center justify-center text-cc-secondary hover:text-[#00BFA5] disabled:opacity-50"
          aria-label="Actualizar insights"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {upToDate && (
        <p className="text-[10px] text-cc-muted -mt-1">
          Los datos no cambiaron; se muestra el último consejo generado.
        </p>
      )}

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
