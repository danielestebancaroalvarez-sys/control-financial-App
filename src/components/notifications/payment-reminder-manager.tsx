'use client'

import { useCallback, useEffect, useRef } from 'react'
import { getPaymentReminderPayload } from '@/lib/notifications/reminder-actions'
import { getTomorrowDateString } from '@/lib/finance/payment-reminders'
import {
  getPaymentReminderMode,
  isPaymentRemindersEnabled,
  markDayBeforeReminderSent,
  markWeeklyReminderSent,
  showPaymentNotification,
  wasDayBeforeReminderSent,
  wasWeeklyReminderSent,
} from '@/lib/notifications/reminder-preferences'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

function buildWeeklyBody(
  payments: { name: string; amountLabel: string; dueDateLabel: string }[]
): string {
  if (payments.length === 0) return 'No tienes pagos recurrentes la próxima semana.'
  const preview = payments
    .slice(0, 4)
    .map(p => `• ${p.name} (${p.amountLabel}) · ${p.dueDateLabel}`)
    .join('\n')
  const extra =
    payments.length > 4 ? `\n…y ${payments.length - 4} más` : ''
  return `${payments.length} pago${payments.length !== 1 ? 's' : ''} programado${payments.length !== 1 ? 's' : ''}:\n${preview}${extra}`
}

export function PaymentReminderManager() {
  const checking = useRef(false)

  const runReminderCheck = useCallback(async () => {
    if (checking.current) return
    if (!isPaymentRemindersEnabled()) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    checking.current = true
    try {
      const payload = await getPaymentReminderPayload()
      if (!payload || payload.payments.length === 0) return

      const mode = getPaymentReminderMode()
      const today = new Date()
      const day = today.getDay()

      if (mode === 'weekly-summary') {
        if (day !== 0 && day !== 1) return
        if (wasWeeklyReminderSent(payload.nextWeekStart)) return

        await showPaymentNotification({
          title: 'Pagos de la próxima semana',
          body: buildWeeklyBody(payload.formattedPayments),
          tag: `weekly-payments-${payload.nextWeekStart}`,
          url: '/predicciones',
        })
        markWeeklyReminderSent(payload.nextWeekStart)
        return
      }

      const tomorrow = getTomorrowDateString()
      const dueTomorrow = payload.formattedPayments.filter(p => p.dueDate === tomorrow)

      for (const payment of dueTomorrow) {
        if (wasDayBeforeReminderSent(payment.id)) continue

        await showPaymentNotification({
          title: `Pago mañana: ${payment.name}`,
          body: `${payment.amountLabel}${payment.categoryName ? ` · ${payment.categoryName}` : ''}`,
          tag: `payment-${payment.id}`,
          url: '/predicciones',
        })
        markDayBeforeReminderSent(payment.id)
      }
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => {
    runReminderCheck()

    const interval = window.setInterval(runReminderCheck, CHECK_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') runReminderCheck()
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [runReminderCheck])

  return null
}
