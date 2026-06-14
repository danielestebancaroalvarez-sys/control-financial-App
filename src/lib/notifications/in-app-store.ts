import type { InAppNotification } from './build-notifications'

const NOTIFICATIONS_KEY = 'couplecash_in_app_notifications'
const READ_KEY = 'couplecash_read_notification_ids'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function readIds(): Set<string> {
  return new Set(readJson<string[]>(READ_KEY, []))
}

export function getReadNotificationIds(): string[] {
  return [...readIds()]
}

export function getStoredNotifications(): InAppNotification[] {
  return readJson<InAppNotification[]>(NOTIFICATIONS_KEY, [])
}

export function syncInAppNotifications(incoming: InAppNotification[]) {
  if (typeof window === 'undefined') return

  const read = readIds()
  const byId = new Map<string, InAppNotification>()

  for (const item of incoming) {
    byId.set(item.id, item)
  }

  const merged = [...byId.values()].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return b.createdAt.localeCompare(a.createdAt)
  })

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(merged))

  const validIds = new Set(merged.map(n => n.id))
  const prunedRead = [...read].filter(id => validIds.has(id))
  localStorage.setItem(READ_KEY, JSON.stringify(prunedRead))

  window.dispatchEvent(new CustomEvent('couplecash-notifications-updated'))
}

export function getUnreadCount(): number {
  const read = readIds()
  return getStoredNotifications().filter(n => !read.has(n.id)).length
}

export function markNotificationRead(id: string) {
  const read = readIds()
  read.add(id)
  localStorage.setItem(READ_KEY, JSON.stringify([...read]))
}

export function markAllNotificationsRead() {
  const ids = getStoredNotifications().map(n => n.id)
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

export function isNotificationRead(id: string): boolean {
  return readIds().has(id)
}
