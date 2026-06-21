'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Loader2, RefreshCw } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import type { CopAudRates } from '@/lib/finance/exchange-rates'
import { formatFxRate } from '@/lib/finance/exchange-rates'

function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export function CurrencyConverterWidget({
  initialRates,
}: {
  initialRates: CopAudRates | null
}) {
  const [rates, setRates] = useState<CopAudRates | null>(initialRates)
  const [loading, setLoading] = useState(!initialRates)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<'aud-cop' | 'cop-aud'>('aud-cop')
  const [amount, setAmount] = useState('1')

  async function refreshRates() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/fx/cop-aud')
      if (!res.ok) throw new Error('fetch failed')
      const data = (await res.json()) as CopAudRates
      setRates(data)
    } catch {
      setError('No se pudo actualizar la tasa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialRates) void refreshRates()
  }, [initialRates])

  const converted = useMemo(() => {
    const value = parseAmount(amount)
    if (value === null || !rates) return null
    if (direction === 'aud-cop') return value * rates.audToCop
    return value * rates.copToAud
  }, [amount, direction, rates])

  const summary = rates
    ? `1 AUD = ${formatFxRate(rates.audToCop, 'COP')} · ${rates.dateLabel}`
    : 'Cargando tasa del día…'

  return (
    <CollapsibleSection
      title="Convertidor COP ↔ AUD"
      summary={summary}
      icon={<ArrowLeftRight className="w-4 h-4 text-[#00BFA5]" />}
      defaultOpen={false}
    >
      <div className="pt-3 space-y-3">
        {rates && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-cc-secondary">
            <span>
              Tasa del día · 1 AUD = {formatFxRate(rates.audToCop, 'COP')}
            </span>
            <button
              type="button"
              onClick={() => void refreshRates()}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[#00BFA5] font-semibold disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Actualizar
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection('aud-cop')}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${
              direction === 'aud-cop'
                ? 'bg-[#00BFA5] text-white'
                : 'cc-surface-muted text-cc-secondary'
            }`}
          >
            AUD → COP
          </button>
          <button
            type="button"
            onClick={() => setDirection('cop-aud')}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${
              direction === 'cop-aud'
                ? 'bg-[#00BFA5] text-white'
                : 'cc-surface-muted text-cc-secondary'
            }`}
          >
            COP → AUD
          </button>
        </div>

        <label className="block text-[11px] text-cc-secondary">
          Monto en {direction === 'aud-cop' ? 'AUD' : 'COP'}
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={direction === 'aud-cop' ? 'Ej: 100' : 'Ej: 400000'}
            className="mt-1 w-full px-3 py-2.5 rounded-xl cc-input text-[14px] outline-none focus:ring-2 focus:ring-[#00BFA5]/30"
          />
        </label>

        {converted !== null && rates && (
          <div className="rounded-xl cc-surface-muted px-3 py-2.5">
            <p className="text-[10px] text-cc-muted mb-0.5">Resultado</p>
            <p className="text-[18px] font-bold text-cc-primary">
              {direction === 'aud-cop'
                ? formatFxRate(converted, 'COP')
                : formatFxRate(converted, 'AUD')}
            </p>
          </div>
        )}

        {error && <p className="text-[11px] text-red-600">{error}</p>}
        {!rates && !loading && (
          <p className="text-[11px] text-cc-secondary">
            No hay tasa disponible. Intenta actualizar en unos minutos.
          </p>
        )}
      </div>
    </CollapsibleSection>
  )
}
