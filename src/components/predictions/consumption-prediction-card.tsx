import type { ConsumptionPrediction } from '@/lib/finance/types'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

export function ConsumptionPredictionCard({
  prediction,
  formatValue,
  compact = false,
}: {
  prediction: ConsumptionPrediction
  formatValue: (n: number) => string
  compact?: boolean
}) {
  const { percentVsAverage } = prediction
  const isOver = percentVsAverage > 5
  const isUnder = percentVsAverage < -5

  const TrendIcon = isOver ? TrendingUp : isUnder ? TrendingDown : Minus
  const trendColor = isOver ? 'text-[#E53935]' : isUnder ? 'text-[#00BFA5]' : 'text-cc-secondary'
  const trendBg = isOver
    ? 'bg-[#FFEBEE] dark:bg-[#3a2228]'
    : isUnder
      ? 'bg-[#E0F2F1] dark:bg-[#1a3330]'
      : 'cc-surface-muted'

  return (
    <div className={`rounded-2xl ${trendBg} p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-bold text-cc-primary">
            Predicción de {prediction.categoryName}
          </p>
          <p className="text-[11px] text-cc-secondary">
            Al ritmo actual, al cierre del {prediction.period === 'weekly' ? 'semana' : 'mes'}
          </p>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-[12px] font-bold">
            {percentVsAverage > 0 ? '+' : ''}
            {percentVsAverage}%
          </span>
        </div>
      </div>

      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
        <div className="p-2 rounded-xl cc-surface">
          <p className="text-[10px] text-cc-secondary">Llevas</p>
          <p className="text-[14px] font-bold text-cc-primary">
            {formatValue(prediction.spentSoFar)}
          </p>
        </div>
        <div className="p-2 rounded-xl cc-surface">
          <p className="text-[10px] text-cc-secondary">Proyectado</p>
          <p className="text-[14px] font-bold text-cc-primary">
            {formatValue(prediction.projectedTotal)}
          </p>
        </div>
        {!compact && (
          <div className="p-2 rounded-xl cc-surface">
            <p className="text-[10px] text-cc-secondary">Promedio</p>
            <p className="text-[14px] font-bold text-cc-secondary">
              {formatValue(prediction.historicalAverage)}
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-cc-secondary">
        {isOver
          ? `Vas ${Math.abs(percentVsAverage)}% por encima de tu promedio. Quedan ${prediction.daysRemaining} días.`
          : isUnder
            ? `Vas ${Math.abs(percentVsAverage)}% por debajo de tu promedio.`
            : `Ritmo similar a tu promedio histórico.`}
      </p>
    </div>
  )
}
