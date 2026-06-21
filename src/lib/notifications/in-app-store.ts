import type { InAppNotification, NotificationModule } from './build-notifications'

const STORAGE_KEYS: Record<NotificationModule, { items: string; read: string }> = {
  finance: {
    items: 'couplecash_in_app_notifications_finance',
    read: 'couplecash_read_notification_ids_finance',
  },
  time: {
    items: 'couplecash_in_app_notifications_time',
    read: 'couplecash_read_notification_ids_time',
  },
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function readIds(module: NotificationModule): Set<string> {
  return new Set(readJson<string[]>(STORAGE_KEYS[module].read, []))
}

export function getStoredNotifications(module: NotificationModule): InAppNotification[] {
  return readJson<InAppNotification[]>(STORAGE_KEYS[module].items, [])
}

export function syncInAppNotifications(
  incoming: InAppNotification[],
  module: NotificationModule
) {
  if (typeof window === 'undefined') return

  const read = readIds(module)
  const byId = new Map<string, InAppNotification>()

  for (const item of incoming) {
    byId.set(item.id, item)
  }

  const merged = [...byId.values()].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return b.createdAt.localeCompare(a.createdAt)
  })

  localStorage.setItem(STORAGE_KEYS[module].items, JSON.stringify(merged))

  const validIds = new Set(merged.map(n => n.id))
  const prunedRead = [...read].filter(id => validIds.has(id))
  localStorage.setItem(STORAGE_KEYS[module].read, JSON.stringify(prunedRead))

  window.dispatchEvent(
    new CustomEvent('couplecash-notifications-updated', { detail: { module } })
  )
}

export function appendInAppNotifications(
  incoming: InAppNotification[],
  module: NotificationModule
) {
  if (typeof window === 'undefined' || incoming.length === 0) return

  const read = readIds(module)
  const byId = new Map<string, InAppNotification>()

  for (const item of getStoredNotifications(module)) {
    byId.set(item.id, item)
  }
  for (const item of incoming) {
    byId.set(item.id, item)
  }

  const merged = [...byId.values()].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return b.createdAt.localeCompare(a.createdAt)
  })

  localStorage.setItem(STORAGE_KEYS[module].items, JSON.stringify(merged))

  const validIds = new Set(merged.map(n => n.id))
  const prunedRead = [...read].filter(id => validIds.has(id))
  localStorage.setItem(STORAGE_KEYS[module].read, JSON.stringify(prunedRead))

  window.dispatchEvent(
    new CustomEvent('couplecash-notifications-updated', { detail: { module } })
  )
}

export function getUnreadCount(module: NotificationModule): number {
  const read = readIds(module)
  return getStoredNotifications(module).filter(n => !read.has(n.id)).length
}

export function markNotificationRead(id: string, module: NotificationModule) {
  const read = readIds(module)
  read.add(id)
  localStorage.setItem(STORAGE_KEYS[module].read, JSON.stringify([...read]))
}

export function markAllNotificationsRead(module: NotificationModule) {
  const ids = getStoredNotifications(module).map(n => n.id)
  localStorage.setItem(STORAGE_KEYS[module].read, JSON.stringify(ids))
}

export function isNotificationRead(id: string, module: NotificationModule): boolean {
  return readIds(module).has(id)
}
