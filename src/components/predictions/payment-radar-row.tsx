import { CategoryIcon } from '@/components/transactions/category-icon'
import { formatFrequency, formatShortDate } from '@/lib/finance/format'
import type { FixedServiceStatus } from '@/lib/finance/types'

export function paymentStatusUi(payment: FixedServiceStatus): {
  badge: string
  badgeClass: string
  detail: string | null
} {
  if (payment.status === 'paid') {
    if (payment.assumedPaid && payment.autoRegister) {
      return {
        badge: 'Pagado',
        badgeClass:
          'bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#1a3328] dark:text-[#66bb6a]',
        detail: null,
      }
    }
    return {
      badge: 'Pagado',
      badgeClass:
        'bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#1a3328] dark:text-[#66bb6a]',
      detail: null,
    }
  }

  if (payment.status === 'overdue') {
    return {
      badge: 'Sin pagar',
      badgeClass:
        'bg-[#FFEBEE] text-[#C62828] dark:bg-[#3a2228] dark:text-[#ef5350]',
      detail: payment.dueDate
        ? `Debía pagarse el ${formatShortDate(payment.dueDate)}`
        : 'No hay registro del pago',
    }
  }

  return {
    badge: 'Por pagar',
    badgeClass:
      'bg-[#FFF8E1] text-[#F59E0B] dark:bg-[#3a3220] dark:text-[#F59E0B]',
    detail: payment.dueDate ? `Vence el ${formatShortDate(payment.dueDate)}` : null,
  }
}

export function PaymentRadarRow({
  payment,
  formatValue,
  variant = 'current',
}: {
  payment: FixedServiceStatus
  formatValue: (n: number) => string
  variant?: 'current' | 'upcoming'
}) {
  const status = variant === 'current' ? paymentStatusUi(payment) : null

  return (
    <li className="flex items-center gap-3 p-3 rounded-2xl cc-surface-muted">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cc-surface text-cc-secondary">
        <CategoryIcon icon={payment.categoryIcon} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-cc-primary truncate">{payment.name}</p>
        <p className="text-[11px] text-cc-secondary">
          {payment.categoryName && <span>{payment.categoryName} · </span>}
          {formatValue(payment.amount)}
          {payment.occurrences && payment.occurrences > 1 && (
            <> · {formatFrequency(payment.frequency, payment.occurrences)}</>
          )}
          {variant === 'upcoming' && payment.dueDate && (
            <> · vence {formatShortDate(payment.dueDate)}</>
          )}
        </p>
        {status?.detail && (
          <p
            className={`text-[10px] mt-0.5 ${
              payment.status === 'overdue'
                ? 'text-[#C62828] dark:text-[#ef5350] font-medium'
                : 'text-cc-muted'
            }`}
          >
            {status.detail}
          </p>
        )}
      </div>
      {variant === 'upcoming' ? (
        <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[#E0F2F1] text-[#00BFA5] dark:bg-[#1a3330] dark:text-[#4db6ac] shrink-0">
          Próximo
        </span>
      ) : (
        status && (
          <span
            className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${status.badgeClass}`}
          >
            {status.badge}
          </span>
        )
      )}
    </li>
  )
}
