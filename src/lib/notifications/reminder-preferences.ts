import {
  buildNotificationPayload,
  financeNotificationTitle,
} from './notification-branding'

export type PaymentReminderMode = 'weekly-summary' | 'day-before'

const KEYS = {
  enabled: 'couplecash_payment_reminders',
  mode: 'couplecash_payment_reminder_mode',
  lastWeekly: 'couplecash_last_weekly_reminder',
  notifiedDays: 'couplecash_notified_payment_days',
} as const

export function isPaymentRemindersEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(KEYS.enabled) === 'true'
}

export function setPaymentRemindersEnabled(enabled: boolean) {
  localStorage.setItem(KEYS.enabled, enabled ? 'true' : 'false')
}

export function getPaymentReminderMode(): PaymentReminderMode {
  if (typeof window === 'undefined') return 'weekly-summary'
  const mode = localStorage.getItem(KEYS.mode)
  return mode === 'day-before' ? 'day-before' : 'weekly-summary'
}

export function setPaymentReminderMode(mode: PaymentReminderMode) {
  localStorage.setItem(KEYS.mode, mode)
}

export function wasWeeklyReminderSent(weekStart: string): boolean {
  return localStorage.getItem(KEYS.lastWeekly) === weekStart
}

export function markWeeklyReminderSent(weekStart: string) {
  localStorage.setItem(KEYS.lastWeekly, weekStart)
}

function readNotifiedDays(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.notifiedDays)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function wasDayBeforeReminderSent(paymentKey: string): boolean {
  return readNotifiedDays().includes(paymentKey)
}

export function markDayBeforeReminderSent(paymentKey: string) {
  const current = readNotifiedDays()
  const trimmed = [...new Set([...current, paymentKey])].slice(-60)
  localStorage.setItem(KEYS.notifiedDays, JSON.stringify(trimmed))
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function canUseNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function showPaymentNotification(options: {
  title: string
  body: string
  tag: string
  url?: string
}) {
  if (!canUseNotifications() || Notification.permission !== 'granted') return

  const payload = buildNotificationPayload({
    body: options.body,
    tag: options.tag,
    url: options.url,
    module: 'finance',
  })

  const title = financeNotificationTitle(options.title)

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null)
    if (registration) {
      await registration.showNotification(title, payload)
      return
    }
  }

  new Notification(title, payload)
}
