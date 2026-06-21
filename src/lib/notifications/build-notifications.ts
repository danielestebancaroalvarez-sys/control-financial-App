import type { PaymentReminderPayload } from './reminder-actions'

export type NotificationModule = 'finance' | 'time'

export type InAppNotification = {
  id: string
  module: NotificationModule
  type:
    | 'weekly-summary'
    | 'payment-upcoming'
    | 'payment-tomorrow'
    | 'partner-expense'
    | 'weekly-activities'
    | 'task-today'
    | 'task-tomorrow'
    | 'task-upcoming'
    | 'goal-milestone'
  title: string
  body: string
  href: string
  dueDate?: string
  createdAt: string
}

export function buildInAppNotifications(
  payload: PaymentReminderPayload
): InAppNotification[] {
  const now = new Date().toISOString()
  const items: InAppNotification[] = []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  if (payload.formattedPayments.length > 0) {
    const preview = payload.formattedPayments
      .slice(0, 3)
      .map(p => `${p.name} (${p.amountLabel})`)
      .join(' · ')

    items.push({
      id: `weekly-${payload.nextWeekStart}`,
      module: 'finance',
      type: 'weekly-summary',
      title: 'Pagos de la próxima semana',
      body:
        payload.formattedPayments.length === 1
          ? preview
          : `${payload.formattedPayments.length} pagos: ${preview}${
              payload.formattedPayments.length > 3 ? '…' : ''
            }`,
      href: '/predicciones',
      createdAt: now,
    })
  }

  for (const payment of payload.formattedPayments) {
    const isTomorrow = payment.dueDate === tomorrowStr
    const href = payment.href ?? '/predicciones'
    items.push({
      id: `payment-${payment.id}`,
      module: 'finance',
      type: isTomorrow ? 'payment-tomorrow' : 'payment-upcoming',
      title: isTomorrow ? `Pago mañana: ${payment.name}` : `Próximo pago: ${payment.name}`,
      body: `${payment.amountLabel} · ${payment.dueDateLabel}${
        payment.categoryName ? ` · ${payment.categoryName}` : ''
      }`,
      href,
      dueDate: payment.dueDate,
      createdAt: now,
    })
  }

  return items
}
