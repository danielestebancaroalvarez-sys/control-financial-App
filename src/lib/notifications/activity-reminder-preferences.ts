import {
  canUseNotifications,
  requestNotificationPermission,
} from './reminder-preferences'
import {
  buildNotificationPayload,
  timeNotificationTitle,
} from './notification-branding'

export type ActivityReminderMode = 'weekly-summary' | 'day-before'

export { canUseNotifications, requestNotificationPermission }

const KEYS = {
  enabled: 'couplecash_activity_reminders',
  mode: 'couplecash_activity_reminder_mode',
  lastWeekly: 'couplecash_last_weekly_activity_reminder',
  notifiedDays: 'couplecash_notified_activity_days',
} as const

export function isActivityRemindersEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(KEYS.enabled) === 'true'
}

export function setActivityRemindersEnabled(enabled: boolean) {
  localStorage.setItem(KEYS.enabled, enabled ? 'true' : 'false')
}

export function getActivityReminderMode(): ActivityReminderMode {
  if (typeof window === 'undefined') return 'weekly-summary'
  const mode = localStorage.getItem(KEYS.mode)
  return mode === 'day-before' ? 'day-before' : 'weekly-summary'
}

export function setActivityReminderMode(mode: ActivityReminderMode) {
  localStorage.setItem(KEYS.mode, mode)
}

export function wasWeeklyActivityReminderSent(weekStart: string): boolean {
  return localStorage.getItem(KEYS.lastWeekly) === weekStart
}

export function markWeeklyActivityReminderSent(weekStart: string) {
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

export function wasDayBeforeActivityReminderSent(activityKey: string): boolean {
  return readNotifiedDays().includes(activityKey)
}

export function markDayBeforeActivityReminderSent(activityKey: string) {
  const current = readNotifiedDays()
  const trimmed = [...new Set([...current, activityKey])].slice(-60)
  localStorage.setItem(KEYS.notifiedDays, JSON.stringify(trimmed))
}

export async function showActivityNotification(options: {
  title: string
  body: string
  tag: string
  url?: string
}) {
  if (!canUseNotifications() || Notification.permission !== 'granted') return

  const payload = buildNotificationPayload({
    body: options.body,
    tag: options.tag,
    url: options.url ?? '/tiempo/tareas',
    module: 'time',
  })

  const title = timeNotificationTitle(options.title)

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null)
    if (registration) {
      await registration.showNotification(title, payload)
      return
    }
  }

  new Notification(title, payload)
}
