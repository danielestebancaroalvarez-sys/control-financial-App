export type NotificationModule = 'finance' | 'time'

export const NOTIFICATION_BRAND = {
  appName: 'Couple Hub',
  icon: '/icon-192.png',
  badge: '/icon-192.png',
} as const

export function financeNotificationTitle(text: string) {
  return `${NOTIFICATION_BRAND.appName} · Finanzas — ${text}`
}

export function timeNotificationTitle(text: string) {
  return `${NOTIFICATION_BRAND.appName} · Tiempo — ${text}`
}

export function buildNotificationPayload(options: {
  body: string
  tag: string
  url?: string
  module: NotificationModule
}) {
  return {
    body: options.body,
    tag: options.tag,
    icon: NOTIFICATION_BRAND.icon,
    badge: NOTIFICATION_BRAND.badge,
    vibrate: [200, 100, 200] as number[],
    data: {
      url: options.url ?? (options.module === 'time' ? '/tiempo' : '/predicciones'),
      module: options.module,
    },
  }
}

export const NOTIFICATION_PERMISSION_HINT =
  'Notificación del navegador cuando la app está abierta o en segundo plano. En iOS puede requerir instalar la PWA y conceder permiso.'
