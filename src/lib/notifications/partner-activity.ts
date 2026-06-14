import { formatMoney } from '@/lib/finance/format'
import type { CurrencyCode } from '@/lib/household/types'
import type { InAppNotification } from './build-notifications'

/** Monto en divisa base del hogar a partir del cual se notifica a la pareja */
export const PARTNER_LARGE_EXPENSE_THRESHOLD = 75

export function buildPartnerExpenseNotification(input: {
  transactionId: string
  authorName: string
  description: string
  amountBase: number
  currency: CurrencyCode
}): InAppNotification {
  const amountLabel = formatMoney(input.amountBase, input.currency)

  return {
    id: `partner-tx-${input.transactionId}`,
    type: 'partner-expense',
    title: `${input.authorName} registró un gasto`,
    body: `${input.description.trim() || 'Gasto'} · ${amountLabel}`,
    href: '/buscar',
    createdAt: new Date().toISOString(),
  }
}
